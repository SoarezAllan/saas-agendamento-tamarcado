import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session || !session.businessId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const whereClause: any = { businessId: session.businessId };

    // Professional can only view their own record
    if (session.role === 'PROFESSIONAL' && session.professionalId) {
      whereClause.id = session.professionalId;
    }

    const professionals = await db.professional.findMany({
      where: whereClause,
      include: {
        services: {
          include: {
            service: true,
          },
        },
        availabilities: {
          orderBy: { dayOfWeek: 'asc' },
        },
        dateOverrides: {
          orderBy: { date: 'asc' },
        },
        user: {
          select: { id: true, email: true, role: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ professionals });
  } catch (error) {
    console.error('List professionals error:', error);
    return NextResponse.json({ error: 'Erro ao listar profissionais' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session || !session.businessId || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const { name, email, phone, avatarUrl, bio, serviceIds } = await req.json();

    if (!name) {
      return NextResponse.json({ error: 'Nome do profissional é obrigatório' }, { status: 400 });
    }

    // 1. Create professional
    const professional = await db.professional.create({
      data: {
        businessId: session.businessId,
        name: name.trim(),
        email: email ? email.trim().toLowerCase() : null,
        phone: phone ? phone.trim() : null,
        avatarUrl: avatarUrl ? avatarUrl.trim() : null,
        bio: bio ? bio.trim() : null,
        active: true,
      },
    });

    // 2. Fetch business default hours to populate initial availability
    const businessHours = await db.businessHours.findMany({
      where: { businessId: session.businessId },
    });

    for (let day = 0; day <= 6; day++) {
      const bh = businessHours.find((b) => b.dayOfWeek === day);
      await db.professionalAvailability.create({
        data: {
          professionalId: professional.id,
          dayOfWeek: day,
          isAvailable: bh ? bh.isOpen : day >= 1 && day <= 5,
          startTime: bh?.openTime || '09:00',
          endTime: bh?.closeTime || '18:00',
          breakStart: bh?.breakStart || '12:00',
          breakEnd: bh?.breakEnd || '13:00',
        },
      });
    }

    // 3. Link services
    if (Array.isArray(serviceIds) && serviceIds.length > 0) {
      for (const sId of serviceIds) {
        await db.serviceProfessional.create({
          data: {
            serviceId: sId,
            professionalId: professional.id,
          },
        });
      }
    }

    const created = await db.professional.findUnique({
      where: { id: professional.id },
      include: {
        services: { include: { service: true } },
        availabilities: { orderBy: { dayOfWeek: 'asc' } },
      },
    });

    return NextResponse.json(
      { message: 'Profissional adicionado com sucesso!', professional: created },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create professional error:', error);
    return NextResponse.json({ error: 'Erro ao criar profissional' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session || !session.businessId || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const { id, name, email, phone, avatarUrl, bio, active, serviceIds } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'ID do profissional é obrigatório' }, { status: 400 });
    }

    const professional = await db.professional.findFirst({
      where: { id, businessId: session.businessId },
    });

    if (!professional) {
      return NextResponse.json({ error: 'Profissional não encontrado' }, { status: 404 });
    }

    await db.professional.update({
      where: { id },
      data: {
        name: name !== undefined ? name.trim() : undefined,
        email: email !== undefined ? (email ? email.trim().toLowerCase() : null) : undefined,
        phone: phone !== undefined ? (phone ? phone.trim() : null) : undefined,
        avatarUrl: avatarUrl !== undefined ? (avatarUrl ? avatarUrl.trim() : null) : undefined,
        bio: bio !== undefined ? (bio ? bio.trim() : null) : undefined,
        active: active !== undefined ? active : undefined,
      },
    });

    if (Array.isArray(serviceIds)) {
      await db.serviceProfessional.deleteMany({
        where: { professionalId: id },
      });

      for (const sId of serviceIds) {
        await db.serviceProfessional.create({
          data: {
            serviceId: sId,
            professionalId: id,
          },
        });
      }
    }

    const updated = await db.professional.findUnique({
      where: { id },
      include: {
        services: { include: { service: true } },
        availabilities: { orderBy: { dayOfWeek: 'asc' } },
      },
    });

    return NextResponse.json({
      message: 'Profissional atualizado com sucesso!',
      professional: updated,
    });
  } catch (error) {
    console.error('Update professional error:', error);
    return NextResponse.json({ error: 'Erro ao atualizar profissional' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session || !session.businessId || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID do profissional é obrigatório' }, { status: 400 });
    }

    const professional = await db.professional.findFirst({
      where: { id, businessId: session.businessId },
    });

    if (!professional) {
      return NextResponse.json({ error: 'Profissional não encontrado' }, { status: 404 });
    }

    await db.professional.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Profissional excluído com sucesso!' });
  } catch (error) {
    console.error('Delete professional error:', error);
    return NextResponse.json({ error: 'Erro ao excluir profissional' }, { status: 500 });
  }
}

