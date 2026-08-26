import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session || !session.businessId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('q')?.toLowerCase() || '';

    const whereClause: any = {
      businessId: session.businessId,
    };

    // Strict Security Isolation: Staff members can only view their own served customers
    if (session.role === 'PROFESSIONAL') {
      if (!session.professionalId) {
        return NextResponse.json({ error: 'Profissional não vinculado' }, { status: 403 });
      }
      whereClause.professionalId = session.professionalId;
    }

    const appointments = await db.appointment.findMany({
      where: whereClause,
      include: {
        service: true,
        professional: true,
      },
      orderBy: { startTime: 'desc' },
    });

    const customerMap = new Map<string, any>();

    for (const appt of appointments) {
      const key = (appt.customerPhone || appt.customerEmail || appt.customerName).trim().toLowerCase();
      if (!customerMap.has(key)) {
        customerMap.set(key, {
          id: key,
          name: appt.customerName,
          phone: appt.customerPhone,
          email: appt.customerEmail,
          totalAppointments: 0,
          completedAppointments: 0,
          totalSpent: 0,
          lastVisit: appt.startTime,
          appointments: [],
        });
      }

      const client = customerMap.get(key);
      client.totalAppointments += 1;
      if (appt.status === 'COMPLETED' || appt.status === 'CONFIRMED') {
        client.completedAppointments += 1;
        client.totalSpent += appt.totalPrice || 0;
      }
      if (client.appointments.length < 5) {
        client.appointments.push(appt);
      }
    }

    let customers = Array.from(customerMap.values());

    if (search) {
      customers = customers.filter(
        (c) =>
          c.name.toLowerCase().includes(search) ||
          c.phone.toLowerCase().includes(search) ||
          (c.email && c.email.toLowerCase().includes(search))
      );
    }

    customers.sort((a, b) => new Date(b.lastVisit).getTime() - new Date(a.lastVisit).getTime());

    return NextResponse.json({ customers });
  } catch (error) {
    console.error('List customers error:', error);
    return NextResponse.json(
      { error: 'Erro ao carregar lista de clientes' },
      { status: 500 }
    );
  }
}
