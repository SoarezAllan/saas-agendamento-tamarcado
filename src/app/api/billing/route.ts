import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session || !session.businessId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const plans = await db.plan.findMany({
      orderBy: { priceMonthly: 'asc' },
    });

    const parsedPlans = plans.map((p) => ({
      ...p,
      features: JSON.parse(p.features || '[]'),
    }));

    const subscription = await db.subscription.findUnique({
      where: { businessId: session.businessId },
    });

    const business = await db.business.findUnique({
      where: { id: session.businessId },
      include: {
        _count: {
          select: {
            professionals: true,
            services: true,
            appointments: true,
          },
        },
      },
    });

    return NextResponse.json({
      plans: parsedPlans,
      subscription,
      usage: {
        professionalsCount: business?._count.professionals || 0,
        servicesCount: business?._count.services || 0,
        appointmentsCount: business?._count.appointments || 0,
        trialEndsAt: subscription?.trialEndsAt || business?.trialEndsAt,
      },
    });
  } catch (error) {
    console.error('Get billing info error:', error);
    return NextResponse.json({ error: 'Erro ao carregar dados de assinatura' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session || !session.businessId || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const {
      planSlug,
      billingCycle = 'MONTHLY',
      paymentMethod = 'CREDIT_CARD',
    } = await req.json();

    if (!planSlug) {
      return NextResponse.json({ error: 'Plano é obrigatório' }, { status: 400 });
    }

    const planUpper = planSlug.toUpperCase();
    const cycleUpper = billingCycle.toUpperCase();
    const methodUpper = paymentMethod.toUpperCase();

    let daysToAdd = 30;
    if (cycleUpper === 'QUARTERLY') daysToAdd = 90;
    else if (cycleUpper === 'ANNUAL') daysToAdd = 365;

    const periodEnd = new Date();
    periodEnd.setDate(periodEnd.getDate() + daysToAdd);

    const subscription = await db.subscription.upsert({
      where: { businessId: session.businessId },
      update: {
        plan: planUpper,
        status: 'ACTIVE',
        billingCycle: cycleUpper,
        paymentMethod: methodUpper,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: false,
      },
      create: {
        businessId: session.businessId,
        plan: planUpper,
        status: 'ACTIVE',
        billingCycle: cycleUpper,
        paymentMethod: methodUpper,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: false,
      },
    });

    return NextResponse.json({
      message: `Assinatura atualizada para o plano ${planUpper} (${cycleUpper}) com sucesso!`,
      subscription,
    });
  } catch (error) {
    console.error('Update subscription error:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar plano de assinatura' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session || !session.businessId || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const subscription = await db.subscription.update({
      where: { businessId: session.businessId },
      data: {
        status: 'CANCELED',
        cancelAtPeriodEnd: true,
      },
    });

    return NextResponse.json({
      message: 'Assinatura cancelada com sucesso. A cobrança automática foi interrompida.',
      subscription,
    });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    return NextResponse.json({ error: 'Erro ao cancelar assinatura' }, { status: 500 });
  }
}
