import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/auth';
import { format, subDays, startOfDay, endOfDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session || !session.businessId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const period = searchParams.get('period') || '30days';
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    const now = new Date();
    let startDate: Date;
    let endDate: Date = endOfDay(now);

    if (period === 'today') {
      startDate = startOfDay(now);
    } else if (period === '7days') {
      startDate = startOfDay(subDays(now, 7));
    } else if (period === '30days') {
      startDate = startOfDay(subDays(now, 30));
    } else if (period === 'year') {
      startDate = startOfDay(subDays(now, 365));
    } else if (startDateParam && endDateParam) {
      startDate = startOfDay(parseISO(startDateParam));
      endDate = endOfDay(parseISO(endDateParam));
    } else {
      startDate = startOfDay(subDays(now, 30));
    }

    const appointments = await db.appointment.findMany({
      where: {
        businessId: session.businessId,
        startTime: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        service: true,
        professional: true,
      },
      orderBy: { startTime: 'asc' },
    });

    let totalRevenue = 0;
    let realizedRevenue = 0;
    let pendingRevenue = 0;
    const statusCounts = {
      COMPLETED: 0,
      CONFIRMED: 0,
      PENDING: 0,
      CANCELLED: 0,
      NO_SHOW: 0,
    };

    const profMap = new Map<string, { id: string; name: string; count: number; revenue: number }>();
    const serviceMap = new Map<string, { id: string; name: string; count: number; revenue: number }>();
    const dailyMap = new Map<string, { date: string; revenue: number; count: number }>();

    for (const appt of appointments) {
      const price = appt.totalPrice || 0;
      const status = appt.status as keyof typeof statusCounts;

      if (statusCounts[status] !== undefined) {
        statusCounts[status] += 1;
      }

      if (status === 'COMPLETED') {
        realizedRevenue += price;
        totalRevenue += price;
      } else if (status === 'CONFIRMED' || status === 'PENDING') {
        pendingRevenue += price;
        totalRevenue += price;
      }

      // Professional Breakdown
      if (status !== 'CANCELLED') {
        const profId = appt.professional.id;
        if (!profMap.has(profId)) {
          profMap.set(profId, {
            id: profId,
            name: appt.professional.name,
            count: 0,
            revenue: 0,
          });
        }
        const profStat = profMap.get(profId)!;
        profStat.count += 1;
        profStat.revenue += price;

        // Service Breakdown
        const srvId = appt.service.id;
        if (!serviceMap.has(srvId)) {
          serviceMap.set(srvId, {
            id: srvId,
            name: appt.service.name,
            count: 0,
            revenue: 0,
          });
        }
        const srvStat = serviceMap.get(srvId)!;
        srvStat.count += 1;
        srvStat.revenue += price;

        // Daily Trend
        const dayKey = format(new Date(appt.startTime), 'yyyy-MM-dd');
        const dayLabel = format(new Date(appt.startTime), 'dd/MM', { locale: ptBR });
        if (!dailyMap.has(dayKey)) {
          dailyMap.set(dayKey, {
            date: dayLabel,
            revenue: 0,
            count: 0,
          });
        }
        const dayStat = dailyMap.get(dayKey)!;
        dayStat.revenue += price;
        dayStat.count += 1;
      }
    }

    const nonCancelledCount = appointments.filter((a) => a.status !== 'CANCELLED').length;
    const averageTicket = nonCancelledCount > 0 ? totalRevenue / nonCancelledCount : 0;

    return NextResponse.json({
      metrics: {
        totalRevenue,
        realizedRevenue,
        pendingRevenue,
        totalAppointments: appointments.length,
        averageTicket,
        statusCounts,
      },
      byProfessional: Array.from(profMap.values()).sort((a, b) => b.revenue - a.revenue),
      byService: Array.from(serviceMap.values()).sort((a, b) => b.revenue - a.revenue),
      dailyTrend: Array.from(dailyMap.values()),
    });
  } catch (error) {
    console.error('Financial metrics error:', error);
    return NextResponse.json(
      { error: 'Erro ao calcular métricas financeiras' },
      { status: 500 }
    );
  }
}

