import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session || !session.businessId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const businessHours = await db.businessHours.findMany({
      where: { businessId: session.businessId },
      orderBy: { dayOfWeek: 'asc' },
    });

    return NextResponse.json({ businessHours });
  } catch (error) {
    console.error('Get business hours error:', error);
    return NextResponse.json(
      { error: 'Erro ao carregar horários de funcionamento' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session || !session.businessId || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const { businessHours } = await req.json();

    if (!Array.isArray(businessHours)) {
      return NextResponse.json({ error: 'Formato inválido' }, { status: 400 });
    }

    for (const item of businessHours) {
      await db.businessHours.upsert({
        where: {
          businessId_dayOfWeek: {
            businessId: session.businessId,
            dayOfWeek: item.dayOfWeek,
          },
        },
        update: {
          isOpen: item.isOpen,
          openTime: item.openTime,
          closeTime: item.closeTime,
          breakStart: item.breakStart || null,
          breakEnd: item.breakEnd || null,
        },
        create: {
          businessId: session.businessId,
          dayOfWeek: item.dayOfWeek,
          isOpen: item.isOpen,
          openTime: item.openTime || '09:00',
          closeTime: item.closeTime || '18:00',
          breakStart: item.breakStart || null,
          breakEnd: item.breakEnd || null,
        },
      });
    }

    const updated = await db.businessHours.findMany({
      where: { businessId: session.businessId },
      orderBy: { dayOfWeek: 'asc' },
    });

    return NextResponse.json({
      message: 'Horários de funcionamento atualizados com sucesso!',
      businessHours: updated,
    });
  } catch (error) {
    console.error('Update business hours error:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar horários de funcionamento' },
      { status: 500 }
    );
  }
}

