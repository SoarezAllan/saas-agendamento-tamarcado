import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import db from '@/lib/db';
import { getClientIp } from '@/lib/rate-limit';
import { getSession } from '@/lib/auth';

function parseUserAgent(uaString: string) {
  const ua = uaString.toLowerCase();

  // 1. Device Type
  let deviceType = 'desktop';
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    deviceType = 'tablet';
  } else if (
    /Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/i.test(
      ua
    )
  ) {
    deviceType = 'mobile';
  }

  // 2. Operating System
  let os = 'Outro SO';
  if (ua.includes('windows nt 10.0')) os = 'Windows 10/11';
  else if (ua.includes('windows nt 6.3')) os = 'Windows 8.1';
  else if (ua.includes('windows nt 6.1')) os = 'Windows 7';
  else if (ua.includes('windows')) os = 'Windows';
  else if (ua.includes('iphone')) os = 'iOS (iPhone)';
  else if (ua.includes('ipad')) os = 'iPadOS (iPad)';
  else if (ua.includes('macintosh') || ua.includes('mac os x')) os = 'macOS (Mac)';
  else if (ua.includes('android')) os = 'Android';
  else if (ua.includes('linux')) os = 'Linux';
  else if (ua.includes('cros')) os = 'ChromeOS';

  // 3. Browser
  let browser = 'Navegador';
  if (ua.includes('edg/')) browser = 'Microsoft Edge';
  else if (ua.includes('opr/') || ua.includes('opera')) browser = 'Opera';
  else if (ua.includes('chrome/') || ua.includes('crios/')) browser = 'Google Chrome';
  else if (ua.includes('firefox/') || ua.includes('fxios/')) browser = 'Mozilla Firefox';
  else if (ua.includes('safari/') && !ua.includes('chrome')) browser = 'Apple Safari';
  else if (ua.includes('samsungbrowser')) browser = 'Samsung Internet';
  else if (ua.includes('instagram')) browser = 'Instagram Webview';
  else if (ua.includes('whatsapp')) browser = 'WhatsApp Webview';

  return { deviceType, os, browser };
}

function normalizeReferrer(ref?: string): string {
  if (!ref || ref.trim() === '') return 'Direto / Navegador';
  try {
    const url = new URL(ref);
    const host = url.hostname.toLowerCase();
    if (host.includes('google')) return 'Google';
    if (host.includes('instagram')) return 'Instagram';
    if (host.includes('whatsapp') || host.includes('wa.me')) return 'WhatsApp';
    if (host.includes('facebook')) return 'Facebook';
    if (host.includes('tiktok')) return 'TikTok';
    if (host.includes('twitter') || host.includes('t.co') || host.includes('x.com')) return 'X / Twitter';
    if (host.includes('linkedin')) return 'LinkedIn';
    if (host.includes('youtube')) return 'YouTube';
    return host.replace(/^www\./, '');
  } catch {
    return 'Outro';
  }
}

async function resolveGeolocation(ip: string, req: NextRequest) {
  // 1. Check Vercel native Edge headers first (fastest, 0ms latency)
  const vercelCountry = req.headers.get('x-vercel-ip-country') || req.headers.get('cf-ipcountry');
  const vercelRegion = req.headers.get('x-vercel-ip-country-region');
  const vercelCity = req.headers.get('x-vercel-ip-city');

  if (vercelCity || vercelCountry) {
    return {
      country: vercelCountry === 'BR' ? 'Brasil' : vercelCountry || 'Brasil',
      countryCode: vercelCountry || 'BR',
      region: vercelRegion ? decodeURIComponent(vercelRegion) : null,
      city: vercelCity ? decodeURIComponent(vercelCity) : null,
    };
  }

  // 2. If running locally or headers not present, check if public IP
  const isLocal = !ip || ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.');
  if (isLocal) {
    return {
      country: 'Brasil (Local)',
      countryCode: 'BR',
      region: 'Desenvolvimento',
      city: 'Ambiente Local',
    };
  }

  // 3. Fallback external GeoIP with timeout
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1200);
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,countryCode,region,regionName,city`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (res.ok) {
      const geo = await res.json();
      if (geo.status === 'success') {
        return {
          country: geo.country || 'Brasil',
          countryCode: geo.countryCode || 'BR',
          region: geo.regionName || geo.region || null,
          city: geo.city || null,
        };
      }
    }
  } catch {
    // Ignore on timeout/error
  }

  return {
    country: 'Brasil',
    countryCode: 'BR',
    region: null,
    city: null,
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { path, referrer, sessionId, screenResolution, language, durationSeconds, isHeartbeat } = body;

    if (!path || typeof path !== 'string') {
      return NextResponse.json({ error: 'Path obrigatório' }, { status: 400 });
    }

    // 1. Filter out internal SuperAdmin pages
    if (path.startsWith('/superadmin')) {
      return NextResponse.json({ success: true, ignored: true });
    }

    // 2. Filter out internal Next.js static asset requests
    if (path.startsWith('/_next') || path.startsWith('/api') || path.includes('.png') || path.includes('.ico')) {
      return NextResponse.json({ success: true });
    }

    // 3. Filter out requests made by logged-in SuperAdmin user
    const session = await getSession(req);
    if (session && session.role === 'SUPERADMIN') {
      return NextResponse.json({ success: true, ignored: true });
    }

    const userAgent = req.headers.get('user-agent') || '';
    // 4. Ignore automated search engine crawlers and deployment bots from human analytics
    const isBot = /bot|googlebot|adsbot|mediapartners|bingbot|crawler|spider|robot|crawling|headless|vercel|lighthouse|inspect|probe/i.test(userAgent);
    if (isBot) {
      return NextResponse.json({ success: true, ignored: true });
    }

    const clientIp = getClientIp(req);
    const dateSalt = new Date().toISOString().slice(0, 10);
    const ipHash = crypto
      .createHash('sha256')
      .update(`${clientIp}-${dateSalt}`)
      .digest('hex')
      .slice(0, 16);

    const { deviceType, os, browser } = parseUserAgent(userAgent);
    const cleanReferrer = normalizeReferrer(referrer);

    if (isHeartbeat && sessionId) {
      // Update duration on existing latest session record
      const latest = await db.pageView.findFirst({
        where: { sessionId },
        orderBy: { createdAt: 'desc' },
      });

      if (latest) {
        await db.pageView.update({
          where: { id: latest.id },
          data: {
            durationSeconds: Math.min(Number(durationSeconds) || 0, 7200),
          },
        });
        return NextResponse.json({ success: true, updated: true });
      }
    }

    // Resolve Geolocation for visitor
    const geo = await resolveGeolocation(clientIp, req);

    // Insert rich page view
    await db.pageView.create({
      data: {
        path: path.slice(0, 200),
        ip: clientIp.slice(0, 45),
        ipHash,
        city: geo.city?.slice(0, 100) || null,
        region: geo.region?.slice(0, 100) || null,
        country: geo.country?.slice(0, 100) || 'Brasil',
        countryCode: geo.countryCode?.slice(0, 10) || 'BR',
        browser: browser.slice(0, 60),
        os: os.slice(0, 60),
        deviceType,
        screenResolution: screenResolution ? String(screenResolution).slice(0, 30) : null,
        language: language ? String(language).slice(0, 20) : null,
        userAgent: userAgent.slice(0, 300),
        referrer: cleanReferrer.slice(0, 100),
        durationSeconds: Number(durationSeconds) || 0,
        sessionId: sessionId ? String(sessionId).slice(0, 100) : null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Telemetry error:', error);
    return NextResponse.json({ success: true }); // Never break user flow
  }
}

