import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session || session.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Acesso restrito ao Super Admin' }, { status: 403 });
    }

    const businesses = await db.business.findMany({
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
    });

    const totalBusinesses = businesses.length;
    const totalAppointments = businesses.reduce((acc, b) => acc + b._count.appointments, 0);
    const totalProfessionals = businesses.reduce((acc, b) => acc + b._count.professionals, 0);

    // Calculate approximate MRR
    const planPrices: Record<string, number> = {
      STARTER: 49.9,
      PRO: 99.9,
      ENTERPRISE: 199.9,
    };

    let estimatedMRR = 0;
    for (const b of businesses) {
      if (b.subscription && b.subscription.status === 'ACTIVE') {
        estimatedMRR += planPrices[b.subscription.plan] || 49.9;
      }
    }

    return NextResponse.json({
      stats: {
        totalBusinesses,
        totalAppointments,
        totalProfessionals,
        estimatedMRR,
      },
      businesses,
    });
  } catch (error) {
    console.error('Super admin error:', error);
    return NextResponse.json(
      { error: 'Erro ao carregar dados do Super Admin' },
      { status: 500 }
    );
  }
}

