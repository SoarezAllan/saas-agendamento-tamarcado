import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/auth';
import { getAllSystemSettings } from '@/lib/settings';
import { testMercadoPagoConnection } from '@/lib/mercadopago';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session || session.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Acesso restrito ao Super Admin' }, { status: 403 });
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      businesses,
      plans,
      settings,
      totalUsers,
      totalPageViews,
      pageViewsToday,
      pageViews7d,
      pageViews30d,
      pageViewsWithDuration,
      recentViews,
      allPageViewsList,
    ] = await Promise.all([
      db.business.findMany({
        where: { isDemo: false },
        include: {
          subscription: true,
          users: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              createdAt: true,
            },
          },
          _count: {
            select: {
              professionals: true,
              services: true,
              appointments: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      db.plan.findMany({
        orderBy: { priceMonthly: 'asc' },
      }),
      getAllSystemSettings(),
      db.user.count({ where: { isDemo: false, role: { not: 'SUPERADMIN' } } }),
      db.pageView.count(),
      db.pageView.count({ where: { createdAt: { gte: todayStart } } }),
      db.pageView.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      db.pageView.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      db.pageView.findMany({
        where: { durationSeconds: { gt: 0 } },
        select: { durationSeconds: true },
        take: 500,
        orderBy: { createdAt: 'desc' },
      }),
      db.pageView.findMany({
        take: 50,
        orderBy: { createdAt: 'desc' },
      }),
      db.pageView.findMany({
        where: { createdAt: { gte: thirtyDaysAgo } },
        select: {
          path: true,
          ip: true,
          ipHash: true,
          city: true,
          region: true,
          country: true,
          countryCode: true,
          browser: true,
          os: true,
          deviceType: true,
          screenResolution: true,
          language: true,
          referrer: true,
          durationSeconds: true,
          createdAt: true,
        },
      }),
    ]);

    // 1. Calculate Real Business & SaaS Metrics
    const totalBusinesses = businesses.length;
    const totalAppointments = businesses.reduce((acc, b: any) => acc + (b._count?.appointments || 0), 0);
    const totalProfessionals = businesses.reduce((acc, b: any) => acc + (b._count?.professionals || 0), 0);

    const activeSubscriptions = businesses.filter(
      (b: any) => b.subscription && b.subscription.status === 'ACTIVE'
    ).length;

    const trialingSubscriptions = businesses.filter(
      (b: any) => !b.subscription || b.subscription.status === 'TRIALING'
    ).length;

    const planPriceMap: Record<string, number> = {};
    plans.forEach((p) => {
      planPriceMap[p.slug.toUpperCase()] = p.priceMonthly;
    });

    let estimatedMRR = 0;
    for (const b of businesses as any[]) {
      if (b.subscription && b.subscription.status === 'ACTIVE') {
        estimatedMRR += planPriceMap[b.subscription.plan] || 49.9;
      }
    }

    // 2. Calculate Real Web Telemetry & Indicators
    const uniqueIpsTotal = new Set(allPageViewsList.map((p) => p.ip || p.ipHash).filter(Boolean)).size;
    const uniqueIpsToday = new Set(
      allPageViewsList
        .filter((p) => new Date(p.createdAt) >= todayStart)
        .map((p) => p.ip || p.ipHash)
        .filter(Boolean)
    ).size;

    // Average Duration
    const totalDurationSeconds = pageViewsWithDuration.reduce((acc, p) => acc + p.durationSeconds, 0);
    const avgDurationSeconds =
      pageViewsWithDuration.length > 0
        ? Math.round(totalDurationSeconds / pageViewsWithDuration.length)
        : 0;

    // Top Pages
    const pageCounts: Record<string, number> = {};
    allPageViewsList.forEach((p) => {
      pageCounts[p.path] = (pageCounts[p.path] || 0) + 1;
    });
    const topPages = Object.entries(pageCounts)
      .map(([path, count]) => ({ path, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    // Top Locations (Cities / Regions)
    const cityCounts: Record<string, number> = {};
    allPageViewsList.forEach((p) => {
      const loc = p.city
        ? `${p.city}${p.region ? ` - ${p.region}` : ''}`
        : p.country || 'Brasil';
      cityCounts[loc] = (cityCounts[loc] || 0) + 1;
    });
    const topCities = Object.entries(cityCounts)
      .map(([location, count]) => ({ location, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    // Top Operating Systems
    const osCounts: Record<string, number> = {};
    allPageViewsList.forEach((p) => {
      const os = p.os || (p.deviceType === 'mobile' ? 'Mobile' : 'Desktop');
      osCounts[os] = (osCounts[os] || 0) + 1;
    });
    const topOS = Object.entries(osCounts)
      .map(([os, count]) => ({ os, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    // Top Browsers
    const browserCounts: Record<string, number> = {};
    allPageViewsList.forEach((p) => {
      const browser = p.browser || 'Navegador';
      browserCounts[browser] = (browserCounts[browser] || 0) + 1;
    });
    const topBrowsers = Object.entries(browserCounts)
      .map(([browser, count]) => ({ browser, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    // Devices Breakdown
    const deviceCounts: Record<string, number> = { desktop: 0, mobile: 0, tablet: 0 };
    allPageViewsList.forEach((p) => {
      const dev = p.deviceType || 'desktop';
      deviceCounts[dev] = (deviceCounts[dev] || 0) + 1;
    });
    const totalDevices = allPageViewsList.length;
    const devicePercentages =
      totalDevices > 0
        ? {
            desktop: Math.round(((deviceCounts.desktop || 0) / totalDevices) * 100),
            mobile: Math.round(((deviceCounts.mobile || 0) / totalDevices) * 100),
            tablet: Math.round(((deviceCounts.tablet || 0) / totalDevices) * 100),
          }
        : { desktop: 0, mobile: 0, tablet: 0 };

    // Traffic Sources (Referrers)
    const trafficCounts: Record<string, number> = {};
    allPageViewsList.forEach((p) => {
      const ref = p.referrer || 'Direto / Navegador';
      trafficCounts[ref] = (trafficCounts[ref] || 0) + 1;
    });
    const topTrafficSources = Object.entries(trafficCounts)
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    // Daily views last 7 days (calculated using precise day boundaries)
    const dailyChart: { date: string; fullDate: string; views: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const dayStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0, 0);
      const dayEnd = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59, 999);

      const day = String(targetDate.getDate()).padStart(2, '0');
      const month = String(targetDate.getMonth() + 1).padStart(2, '0');
      const dateLabel = `${day}/${month}`;

      const dayViews = allPageViewsList.filter((p) => {
        const pDate = new Date(p.createdAt);
        return pDate >= dayStart && pDate <= dayEnd;
      }).length;

      dailyChart.push({
        date: dateLabel,
        fullDate: `${day}/${month}/${targetDate.getFullYear()}`,
        views: dayViews,
      });
    }

    // Conversion Rate: Landing page views to businesses registered
    const landingViews = pageCounts['/'] || totalPageViews || 0;
    const conversionRate =
      landingViews > 0
        ? Math.min(
            Math.round(((totalBusinesses + totalAppointments) / landingViews) * 1000) / 10,
            100
          )
        : 0;

    const parsedPlans = plans.map((p) => ({
      ...p,
      features: JSON.parse(p.features || '[]'),
    }));

    const mpStatus = await testMercadoPagoConnection(settings.MERCADO_PAGO_ACCESS_TOKEN);

    return NextResponse.json({
      stats: {
        totalBusinesses,
        totalAppointments,
        totalProfessionals,
        totalUsers,
        activeSubscriptions,
        trialingSubscriptions,
        estimatedMRR,
      },
      analytics: {
        totalPageViews,
        pageViewsToday,
        pageViews7d,
        pageViews30d,
        uniqueVisitorsCount: uniqueIpsTotal,
        uniqueVisitorsToday: uniqueIpsToday,
        avgDurationSeconds,
        avgDurationFormatted: `${Math.floor(avgDurationSeconds / 60)}m ${avgDurationSeconds % 60}s`,
        conversionRate,
        topPages,
        topCities,
        topBrowsers,
        topOS,
        devicePercentages,
        deviceCounts,
        topTrafficSources,
        dailyChart,
        recentViews,
      },
      businesses,
      plans: parsedPlans,
      settings,
      mercadoPagoStatus: mpStatus,
    });
  } catch (error) {
    console.error('Super admin error:', error);
    return NextResponse.json(
      { error: 'Erro ao carregar dados do Super Admin' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session || session.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Acesso restrito ao Super Admin' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const target = searchParams.get('target');

    if (target === 'telemetry') {
      await db.pageView.deleteMany({});
      return NextResponse.json({ success: true, message: 'Indicadores de telemetria zerados com sucesso' });
    }

    return NextResponse.json({ error: 'Alvo de exclusão inválido' }, { status: 400 });
  } catch (error) {
    console.error('Delete error in superadmin:', error);
    return NextResponse.json({ error: 'Erro ao zerar indicadores' }, { status: 500 });
  }
}
