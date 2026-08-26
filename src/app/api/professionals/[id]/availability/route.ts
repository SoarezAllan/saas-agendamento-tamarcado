import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession(req);

    if (!session || !session.businessId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const availabilities = await db.professionalAvailability.findMany({
      where: {
        professionalId: id,
        professional: { businessId: session.businessId },
      },
      orderBy: { dayOfWeek: 'asc' },
    });

    return NextResponse.json({ availabilities });
  } catch (error) {
    console.error('Get availability error:', error);
    return NextResponse.json(
      { error: 'Erro ao carregar disponibilidade' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession(req);

    if (!session || !session.businessId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Role check: Admin or the Professional themselves
    if (session.role === 'PROFESSIONAL' && session.professionalId !== id) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const { availabilities } = await req.json();

    if (!Array.isArray(availabilities)) {
      return NextResponse.json(
        { error: 'Formato inválido de disponibilidade' },
        { status: 400 }
      );
    }

    for (const item of availabilities) {
      await db.professionalAvailability.upsert({
        where: {
          professionalId_dayOfWeek: {
            professionalId: id,
            dayOfWeek: item.dayOfWeek,
          },
        },
        update: {
          isAvailable: item.isAvailable,
          startTime: item.startTime,
          endTime: item.endTime,
          breakStart: item.breakStart || null,
          breakEnd: item.breakEnd || null,
        },
        create: {
          professionalId: id,
          dayOfWeek: item.dayOfWeek,
          isAvailable: item.isAvailable,
          startTime: item.startTime || '09:00',
          endTime: item.endTime || '18:00',
          breakStart: item.breakStart || null,
          breakEnd: item.breakEnd || null,
        },
      });
    }

    const updated = await db.professionalAvailability.findMany({
      where: { professionalId: id },
      orderBy: { dayOfWeek: 'asc' },
    });

    return NextResponse.json({
      message: 'Disponibilidade atualizada com sucesso!',
      availabilities: updated,
    });
  } catch (error) {
    console.error('Update availability error:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar disponibilidade' },
      { status: 500 }
    );
  }
}

