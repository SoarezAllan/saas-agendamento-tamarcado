import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import db from '@/lib/db';
import { dispatchAppointmentNotification } from '@/lib/notifications';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    let customer = null;
    if (session.role === 'CUSTOMER') {
      customer = await db.customer.findUnique({
        where: { id: session.userId },
      });
    } else if (session.email) {
      customer = await db.customer.findUnique({
        where: { email: session.email.toLowerCase().trim() },
      });
      if (!customer) {
        customer = {
          id: session.userId,
          name: session.name,
          email: session.email,
          phone: '',
        };
      }
    }

    const searchEmail = session.email ? session.email.toLowerCase().trim() : (customer?.email || '');
    const searchPhone = customer?.phone || '';

    const appointments = await db.appointment.findMany({
      where: {
        OR: [
          ...(customer?.id ? [{ customerId: customer.id }] : []),
          ...(searchPhone ? [{ customerPhone: searchPhone }] : []),
          ...(searchEmail ? [{ customerEmail: searchEmail }] : []),
        ],
      },
      include: {
        business: {
          select: {
            id: true,
            name: true,
            slug: true,
            address: true,
            phone: true,
            logoUrl: true,
            primaryColor: true,
          },
        },
        service: {
          select: {
            id: true,
            name: true,
            durationMinutes: true,
            price: true,
            priceOnRequest: true,
          },
        },
        professional: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            phone: true,
          },
        },
      },
      orderBy: {
        startTime: 'desc',
      },
    });

    const now = new Date();
    const upcoming = appointments.filter(
      (a) => new Date(a.endTime) >= now && a.status !== 'CANCELLED' && a.status !== 'NO_SHOW'
    ).reverse(); // closest first

    const past = appointments.filter(
      (a) => new Date(a.endTime) < now || a.status === 'CANCELLED' || a.status === 'NO_SHOW'
    );

    return NextResponse.json({
      customer,
      upcoming,
      past,
      totalCount: appointments.length,
    });
  } catch (error: any) {
    console.error('Customer list appointments error:', error);
    return NextResponse.json(
      { error: 'Erro ao carregar agendamentos do cliente' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const appointmentId = searchParams.get('id');

    if (!appointmentId) {
      return NextResponse.json({ error: 'ID do agendamento é obrigatório' }, { status: 400 });
    }

    const searchEmail = session.email ? session.email.toLowerCase().trim() : '';

    const appointment = await db.appointment.findFirst({
      where: {
        id: appointmentId,
        OR: [
          { customerId: session.userId },
          ...(searchEmail ? [{ customerEmail: searchEmail }] : []),
        ],
      },
    });

    if (!appointment) {
      return NextResponse.json(
        { error: 'Agendamento não encontrado ou não pertence a esta conta' },
        { status: 404 }
      );
    }

    if (appointment.status === 'CANCELLED') {
      return NextResponse.json({ message: 'Este agendamento já se encontra cancelado.' });
    }

    const updated = await db.appointment.update({
      where: { id: appointment.id },
      data: {
        status: 'CANCELLED',
      },
    });

    // Notify Business Owner & Professional
    await dispatchAppointmentNotification('CANCELLED', updated.id);

    return NextResponse.json({
      success: true,
      message: 'Agendamento cancelado com sucesso.',
      appointment: updated,
    });
  } catch (error: any) {
    console.error('Customer cancel appointment error:', error);
    return NextResponse.json(
      { error: 'Erro ao cancelar agendamento' },
      { status: 500 }
    );
  }
}

