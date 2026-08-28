import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session || !session.businessId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const services = await db.service.findMany({
      where: { businessId: session.businessId },
      include: {
        professionals: {
          include: {
            professional: {
              select: { id: true, name: true, avatarUrl: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ services });
  } catch (error) {
    console.error('List services error:', error);
    return NextResponse.json({ error: 'Erro ao listar serviços' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session || !session.businessId || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const { name, description, durationMinutes, price, priceOnRequest, category, professionalIds } =
      await req.json();

    if (!name || durationMinutes === undefined) {
      return NextResponse.json(
        { error: 'Nome e duração são obrigatórios' },
        { status: 400 }
      );
    }

    const isPriceOnRequest = Boolean(priceOnRequest) || price === null || price === undefined || price === '';
    const numericPrice = isPriceOnRequest ? 0.0 : (parseFloat(price) || 0.0);

    // Check Plan Services Limit
    const subscription = await db.subscription.findUnique({
      where: { businessId: session.businessId },
    });
    const currentPlanSlug = subscription?.plan?.toLowerCase() || 'starter';
    const plan = await db.plan.findUnique({
      where: { slug: currentPlanSlug },
    });

    if (plan && plan.maxServices && plan.maxServices < 999) {
      const currentCount = await db.service.count({
        where: { businessId: session.businessId, active: true },
      });
      if (currentCount >= plan.maxServices) {
        return NextResponse.json(
          { error: `Seu plano (${plan.name}) permite até ${plan.maxServices} serviços ativos. Faça upgrade para cadastrar mais serviços.` },
          { status: 400 }
        );
      }
    }

    const service = await db.service.create({
      data: {
        businessId: session.businessId,
        name: name.trim(),
        description: description ? description.trim() : null,
        durationMinutes: parseInt(durationMinutes, 10),
        price: numericPrice,
        priceOnRequest: isPriceOnRequest,
        category: category ? category.trim() : 'Geral',
        active: true,
      },
    });

    if (Array.isArray(professionalIds) && professionalIds.length > 0) {
      for (const pId of professionalIds) {
        await db.serviceProfessional.create({
          data: {
            serviceId: service.id,
            professionalId: pId,
          },
        });
      }
    }

    const createdService = await db.service.findUnique({
      where: { id: service.id },
      include: {
        professionals: {
          include: { professional: true },
        },
      },
    });

    return NextResponse.json(
      { message: 'Serviço criado com sucesso!', service: createdService },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create service error:', error);
    return NextResponse.json({ error: 'Erro ao criar serviço' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session || !session.businessId || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 403 });
    }

    const { id, name, description, durationMinutes, price, priceOnRequest, category, active, professionalIds } =
      await req.json();

    if (!id) {
      return NextResponse.json({ error: 'ID do serviço é obrigatório' }, { status: 400 });
    }

    const service = await db.service.findFirst({
      where: { id, businessId: session.businessId },
    });

    if (!service) {
      return NextResponse.json({ error: 'Serviço não encontrado' }, { status: 404 });
    }

    const isPriceOnRequest = priceOnRequest !== undefined ? Boolean(priceOnRequest) : undefined;
    let numericPrice: number | undefined = undefined;
    if (isPriceOnRequest === true) {
      numericPrice = 0.0;
    } else if (price !== undefined && price !== '') {
      numericPrice = parseFloat(price);
    }

    await db.service.update({
      where: { id },
      data: {
        name: name !== undefined ? name.trim() : undefined,
        description: description !== undefined ? description?.trim() : undefined,
        durationMinutes: durationMinutes !== undefined ? parseInt(durationMinutes, 10) : undefined,
        price: numericPrice,
        priceOnRequest: isPriceOnRequest,
        category: category !== undefined ? category?.trim() : undefined,
        active: active !== undefined ? active : undefined,
      },
    });

    if (Array.isArray(professionalIds)) {
      await db.serviceProfessional.deleteMany({
        where: { serviceId: id },
      });

      for (const pId of professionalIds) {
        await db.serviceProfessional.create({
          data: {
            serviceId: id,
            professionalId: pId,
          },
        });
      }
    }

    const updatedService = await db.service.findUnique({
      where: { id },
      include: {
        professionals: {
          include: { professional: true },
        },
      },
    });

    return NextResponse.json({
      message: 'Serviço atualizado com sucesso!',
      service: updatedService,
    });
  } catch (error) {
    console.error('Update service error:', error);
    return NextResponse.json({ error: 'Erro ao atualizar serviço' }, { status: 500 });
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
      return NextResponse.json({ error: 'ID do serviço é obrigatório' }, { status: 400 });
    }

    const service = await db.service.findFirst({
      where: { id, businessId: session.businessId },
    });

    if (!service) {
      return NextResponse.json({ error: 'Serviço não encontrado' }, { status: 404 });
    }

    await db.service.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Serviço excluído com sucesso!' });
  } catch (error) {
    console.error('Delete service error:', error);
    return NextResponse.json({ error: 'Erro ao excluir serviço' }, { status: 500 });
  }
}

