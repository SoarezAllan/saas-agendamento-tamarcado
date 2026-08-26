import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session || session.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Acesso restrito ao Super Admin' }, { status: 403 });
    }

    const plans = await db.plan.findMany({
      orderBy: { priceMonthly: 'asc' },
    });

    const parsed = plans.map((p) => ({
      ...p,
      features: JSON.parse(p.features || '[]'),
    }));

    return NextResponse.json({ plans: parsed });
  } catch (error: any) {
    console.error('Superadmin get plans error:', error);
    return NextResponse.json({ error: 'Erro ao listar planos' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session || session.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Acesso restrito ao Super Admin' }, { status: 403 });
    }

    const { id, priceMonthly, maxProfessionals, maxServices, maxAppointmentsPerMonth, features } =
      await req.json();

    if (!id) {
      return NextResponse.json({ error: 'ID do plano é obrigatório' }, { status: 400 });
    }

    const updatedPlan = await db.plan.update({
      where: { id },
      data: {
        ...(priceMonthly !== undefined && { priceMonthly: Number(priceMonthly) }),
        ...(maxProfessionals !== undefined && { maxProfessionals: Number(maxProfessionals) }),
        ...(maxServices !== undefined && { maxServices: Number(maxServices) }),
        ...(maxAppointmentsPerMonth !== undefined && {
          maxAppointmentsPerMonth: Number(maxAppointmentsPerMonth),
        }),
        ...(features !== undefined && {
          features: typeof features === 'string' ? features : JSON.stringify(features),
        }),
      },
    });

    return NextResponse.json({
      message: `Plano "${updatedPlan.name}" atualizado com sucesso!`,
      plan: {
        ...updatedPlan,
        features: JSON.parse(updatedPlan.features || '[]'),
      },
    });
  } catch (error: any) {
    console.error('Superadmin update plan error:', error);
    return NextResponse.json({ error: 'Erro ao atualizar plano' }, { status: 500 });
  }
}

