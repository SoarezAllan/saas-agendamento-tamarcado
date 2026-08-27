import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { calculateAvailableSlots } from '@/lib/slots';
import { dispatchAppointmentNotification } from '@/lib/notifications';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    if (!token) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 400 });
    }

    const appointment = await db.appointment.findUnique({
      where: { manageToken: token },
      include: {
        business: {
          select: {
            id: true,
            name: true,
            slug: true,
            category: true,
            phone: true,
            address: true,
            primaryColor: true,
            logoUrl: true,
          },
        },
        service: true,
        professional: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (!appointment) {
      return NextResponse.json({ error: 'Agendamento não encontrado' }, { status: 404 });
    }

    return NextResponse.json({ appointment });
  } catch (error) {
    console.error('Get appointment by token error:', error);
    return NextResponse.json(
      { error: 'Erro ao carregar agendamento' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const { action, dateStr, timeStr, professionalId } = await req.json();

    const appointment = await db.appointment.findUnique({
      where: { manageToken: token },
      include: { service: true, business: true },
    });

    if (!appointment) {
      return NextResponse.json({ error: 'Agendamento não encontrado' }, { status: 404 });
    }

    if (action === 'CANCEL') {
      const updated = await db.appointment.update({
        where: { manageToken: token },
        data: { status: 'CANCELLED' },
      });

      // Notify Owner and Professional of Cancellation
      await dispatchAppointmentNotification('CANCELLED', updated.id);

      return NextResponse.json({
        message: 'Agendamento cancelado com sucesso',
        appointment: updated,
      });
    }

    if (action === 'RESCHEDULE') {
      if (!dateStr || !timeStr) {
        return NextResponse.json(
          { error: 'Nova data e horário são obrigatórios' },
          { status: 400 }
        );
      }

      const targetProfId = professionalId || appointment.professionalId;

      // Check slot availability
      const availability = await calculateAvailableSlots({
        businessId: appointment.businessId,
        serviceId: appointment.serviceId,
        dateStr,
        professionalId: targetProfId,
      });

      const matchingSlot = availability.slots.find((s) => s.time === timeStr);
      if (!matchingSlot) {
        return NextResponse.json(
          { error: 'O horário selecionado não está disponível' },
          { status: 409 }
        );
      }

      const [year, month, day] = dateStr.split('-').map(Number);
      const [hours, minutes] = timeStr.split(':').map(Number);

      const startTime = new Date(year, month - 1, day, hours, minutes, 0);
      const endTime = new Date(
        startTime.getTime() + appointment.service.durationMinutes * 60 * 1000
      );

      const updated = await db.appointment.update({
        where: { manageToken: token },
        data: {
          startTime,
          endTime,
          professionalId: targetProfId,
          status: 'CONFIRMED',
        },
        include: {
          service: true,
          professional: true,
          business: true,
        },
      });

      // Notify Owner and Professional of Rescheduling
      await dispatchAppointmentNotification('RESCHEDULED', updated.id);

      return NextResponse.json({
        message: 'Agendamento remarcado com sucesso!',
        appointment: updated,
      });
    }

    return NextResponse.json({ error: 'Ação não suportada' }, { status: 400 });
  } catch (error) {
    console.error('Manage appointment error:', error);
    return NextResponse.json(
      { error: 'Erro ao processar solicitação' },
      { status: 500 }
    );
  }
}

