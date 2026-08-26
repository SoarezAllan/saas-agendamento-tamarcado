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
    let professionalId = searchParams.get('professionalId');
    const startDate = searchParams.get('startDate'); // YYYY-MM-DD
    const endDate = searchParams.get('endDate'); // YYYY-MM-DD

    // Professional can only query their own overrides
    if (session.role === 'PROFESSIONAL') {
      professionalId = session.professionalId || null;
      if (!professionalId) {
        return NextResponse.json({ error: 'Profissional não vinculado' }, { status: 403 });
      }
    }

    const whereClause: any = {
      professional: {
        businessId: session.businessId,
      },
    };

    if (professionalId && professionalId !== 'all') {
      whereClause.professionalId = professionalId;
    }

    if (startDate && endDate) {
      whereClause.date = {
        gte: startDate,
        lte: endDate,
      };
    } else if (startDate) {
      whereClause.date = { gte: startDate };
    }

    const overrides = await db.professionalDateOverride.findMany({
      where: whereClause,
      include: {
        professional: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
      orderBy: { date: 'asc' },
    });

    return NextResponse.json({ overrides });
  } catch (error) {
    console.error('Fetch professional overrides error:', error);
    return NextResponse.json(
      { error: 'Erro ao carregar folgas e horários especiais' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session || !session.businessId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await req.json();
    let {
      professionalId,
      date,
      dates, // optional array for batch actions (e.g. week / multiple dates)
      isAvailable = false,
      startTime = '09:00',
      endTime = '18:00',
      breakStart = '12:00',
      breakEnd = '13:00',
      reason = 'Folga',
    } = body;

    // Professional can only modify their own schedule
    if (session.role === 'PROFESSIONAL') {
      professionalId = session.professionalId;
      if (!professionalId) {
        return NextResponse.json({ error: 'Profissional não vinculado' }, { status: 403 });
      }
    }

    if (!professionalId) {
      return NextResponse.json(
        { error: 'Profissional obrigatório' },
        { status: 400 }
      );
    }

    // Verify professional belongs to current business
    const prof = await db.professional.findFirst({
      where: { id: professionalId, businessId: session.businessId },
    });

    if (!prof) {
      return NextResponse.json(
        { error: 'Profissional não encontrado' },
        { status: 404 }
      );
    }

    const targetDates: string[] = Array.isArray(dates) && dates.length > 0 ? dates : date ? [date] : [];

    if (targetDates.length === 0) {
      return NextResponse.json(
        { error: 'Nenhuma data informada' },
        { status: 400 }
      );
    }

    // Upsert each date override
    const results = await Promise.all(
      targetDates.map((d) =>
        db.professionalDateOverride.upsert({
          where: {
            professionalId_date: {
              professionalId,
              date: d,
            },
          },
          create: {
            professionalId,
            date: d,
            isAvailable: Boolean(isAvailable),
            startTime: isAvailable ? startTime : null,
            endTime: isAvailable ? endTime : null,
            breakStart: isAvailable ? breakStart : null,
            breakEnd: isAvailable ? breakEnd : null,
            reason: reason || (isAvailable ? 'Horário Especial' : 'Folga'),
          },
          update: {
            isAvailable: Boolean(isAvailable),
            startTime: isAvailable ? startTime : null,
            endTime: isAvailable ? endTime : null,
            breakStart: isAvailable ? breakStart : null,
            breakEnd: isAvailable ? breakEnd : null,
            reason: reason || (isAvailable ? 'Horário Especial' : 'Folga'),
          },
        })
      )
    );

    return NextResponse.json({
      message: 'Folga / Horário especial salvo com sucesso!',
      count: results.length,
      overrides: results,
    });
  } catch (error) {
    console.error('Save professional override error:', error);
    return NextResponse.json(
      { error: 'Erro ao salvar folga ou horário' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session || !session.businessId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    let professionalId = searchParams.get('professionalId');
    const date = searchParams.get('date');

    if (session.role === 'PROFESSIONAL') {
      professionalId = session.professionalId || null;
    }

    if (!professionalId || !date) {
      return NextResponse.json(
        { error: 'Parâmetros professionalId e date são obrigatórios' },
        { status: 400 }
      );
    }

    // Verify professional belongs to current business
    const prof = await db.professional.findFirst({
      where: { id: professionalId, businessId: session.businessId },
    });

    if (!prof) {
      return NextResponse.json({ error: 'Profissional não encontrado' }, { status: 404 });
    }

    await db.professionalDateOverride.deleteMany({
      where: {
        professionalId,
        date,
      },
    });

    return NextResponse.json({
      message: 'Horário restaurado para o padrão semanal com sucesso!',
    });
  } catch (error) {
    console.error('Delete override error:', error);
    return NextResponse.json(
      { error: 'Erro ao remover folga ou horário especial' },
      { status: 500 }
    );
  }
}
