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

    const [businesses, plans, settings] = await Promise.all([
      db.business.findMany({
        include: {
          subscription: true,
          users: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
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
    ]);

    const totalBusinesses = businesses.length;
    const totalAppointments = businesses.reduce((acc, b) => acc + b._count.appointments, 0);
    const totalProfessionals = businesses.reduce((acc, b) => acc + b._count.professionals, 0);

    const activeSubscriptions = businesses.filter(
      (b) => b.subscription && b.subscription.status === 'ACTIVE'
    ).length;

    const trialingSubscriptions = businesses.filter(
      (b) => !b.subscription || b.subscription.status === 'TRIALING'
    ).length;

    // Calculate approximate MRR
    const planPriceMap: Record<string, number> = {};
    plans.forEach((p) => {
      planPriceMap[p.slug.toUpperCase()] = p.priceMonthly;
    });

    let estimatedMRR = 0;
    for (const b of businesses) {
      if (b.subscription && b.subscription.status === 'ACTIVE') {
        estimatedMRR += planPriceMap[b.subscription.plan] || 49.9;
      }
    }

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
        activeSubscriptions,
        trialingSubscriptions,
        estimatedMRR,
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
