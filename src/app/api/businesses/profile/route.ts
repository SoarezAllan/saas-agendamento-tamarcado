import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getSession } from '@/lib/auth';
import { slugify } from '@/lib/utils';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session || !session.businessId) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const business = await db.business.findUnique({
      where: { id: session.businessId },
      include: {
        subscription: true,
        businessHours: {
          orderBy: { dayOfWeek: 'asc' },
        },
        _count: {
          select: {
            services: true,
            professionals: true,
            appointments: true,
          },
        },
      },
    });

    if (!business) {
      return NextResponse.json({ error: 'Negócio não encontrado' }, { status: 404 });
    }

    return NextResponse.json({ business });
  } catch (error) {
    console.error('Get business profile error:', error);
    return NextResponse.json(
      { error: 'Erro ao carregar perfil do negócio' },
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

    const {
      name,
      slug,
      category,
      description,
      logoUrl,
      primaryColor,
      address,
      phone,
      email,
    } = await req.json();

    const updateData: any = {};
    if (name) updateData.name = name.trim();
    if (category) updateData.category = category.trim();
    if (description !== undefined) updateData.description = description ? description.trim() : null;
    if (logoUrl !== undefined) updateData.logoUrl = logoUrl ? logoUrl.trim() : null;
    if (primaryColor) updateData.primaryColor = primaryColor.trim();
    if (address !== undefined) updateData.address = address ? address.trim() : null;
    if (phone !== undefined) updateData.phone = phone ? phone.trim() : null;
    if (email !== undefined) updateData.email = email ? email.trim().toLowerCase() : null;

    if (slug) {
      const cleanSlug = slugify(slug);
      const existing = await db.business.findFirst({
        where: {
          slug: cleanSlug,
          id: { not: session.businessId },
        },
      });

      if (existing) {
        return NextResponse.json(
          { error: 'Este slug/endereço já está em uso por outro negócio' },
          { status: 409 }
        );
      }
      updateData.slug = cleanSlug;
    }

    const updated = await db.business.update({
      where: { id: session.businessId },
      data: updateData,
    });

    return NextResponse.json({
      message: 'Dados do negócio atualizados com sucesso!',
      business: updated,
    });
  } catch (error) {
    console.error('Update business profile error:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar dados do negócio' },
      { status: 500 }
    );
  }
}

