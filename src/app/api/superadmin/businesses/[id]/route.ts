import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession(req);
    if (!session || session.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Acesso restrito ao Super Admin' }, { status: 403 });
    }

    const { id: businessId } = await params;
    const body = await req.json();

    const business = await db.business.findUnique({
      where: { id: businessId },
      include: { subscription: true },
    });

    if (!business) {
      return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 404 });
    }

    // Handle Subscription update
    const updateData: any = {};
    if (body.plan) {
      updateData.plan = body.plan.toUpperCase();
    }
    if (body.status) {
      updateData.status = body.status.toUpperCase();
    }
    if (body.extendDays && Number(body.extendDays) > 0) {
      const currentEnd = business.subscription?.currentPeriodEnd || new Date();
      const baseDate = new Date(currentEnd) > new Date() ? new Date(currentEnd) : new Date();
      baseDate.setDate(baseDate.getDate() + Number(body.extendDays));
      updateData.currentPeriodEnd = baseDate;
      updateData.status = 'ACTIVE';
    }

    if (Object.keys(updateData).length > 0) {
      await db.subscription.upsert({
        where: { businessId },
        update: updateData,
        create: {
          businessId,
          plan: updateData.plan || 'STARTER',
          status: updateData.status || 'ACTIVE',
          currentPeriodEnd: updateData.currentPeriodEnd,
        },
      });
    }

    // Optional business updates (e.g. name, isActive)
    if (body.name || body.slug) {
      await db.business.update({
        where: { id: businessId },
        data: {
          ...(body.name && { name: body.name }),
          ...(body.slug && { slug: body.slug }),
        },
      });
    }

    const updatedBusiness = await db.business.findUnique({
      where: { id: businessId },
      include: {
        subscription: true,
        users: { select: { id: true, name: true, email: true, role: true } },
        _count: { select: { professionals: true, services: true, appointments: true } },
      },
    });

    return NextResponse.json({
      message: `Empresa "${business.name}" atualizada com sucesso!`,
      business: updatedBusiness,
    });
  } catch (error: any) {
    console.error('Superadmin update business error:', error);
    return NextResponse.json({ error: 'Erro ao atualizar empresa' }, { status: 500 });
  }
}
