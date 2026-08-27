import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import db from '@/lib/db';
import { getClientIp } from '@/lib/rate-limit';

function getDeviceType(userAgent: string): string {
  const ua = userAgent.toLowerCase();
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'tablet';
  }
  if (
    /Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/i.test(
      ua
    )
  ) {
    return 'mobile';
  }
  return 'desktop';
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { path, referrer, sessionId, durationSeconds, isHeartbeat } = body;

    if (!path || typeof path !== 'string') {
      return NextResponse.json({ error: 'Path obrigatório' }, { status: 400 });
    }

    // Filter out internal Next.js static asset requests if any
    if (path.startsWith('/_next') || path.startsWith('/api') || path.includes('.')) {
      return NextResponse.json({ success: true });
    }

    const clientIp = getClientIp(req);
    const dateSalt = new Date().toISOString().slice(0, 10);
    const ipHash = crypto
      .createHash('sha256')
      .update(`${clientIp}-${dateSalt}`)
      .digest('hex')
      .slice(0, 16);

    const userAgent = req.headers.get('user-agent') || '';
    const deviceType = getDeviceType(userAgent);
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

    // Insert new page view
    await db.pageView.create({
      data: {
        path: path.slice(0, 200),
        ipHash,
        userAgent: userAgent.slice(0, 300),
        deviceType,
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
