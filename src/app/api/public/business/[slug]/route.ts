import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    if (!slug) {
      return NextResponse.json({ error: 'Slug não informado' }, { status: 400 });
    }

    const business = await db.business.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        slug: true,
        category: true,
        description: true,
        logoUrl: true,
        primaryColor: true,
        address: true,
        phone: true,
        email: true,
        serviceTerm: true,
        proTerm: true,
        businessHours: {
          orderBy: { dayOfWeek: 'asc' },
        },
        services: {
          where: { active: true },
          select: {
            id: true,
            name: true,
            description: true,
            durationMinutes: true,
            price: true,
            priceOnRequest: true,
            category: true,
            professionals: {
              select: {
                professionalId: true,
              },
            },
          },
          orderBy: { name: 'asc' },
        },
        professionals: {
          where: { active: true },
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            bio: true,
            services: {
              select: {
                serviceId: true,
              },
            },
          },
          orderBy: { name: 'asc' },
        },
      },
    });

    if (!business) {
      return NextResponse.json(
        { error: 'Estabelecimento não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ business });
  } catch (error) {
    console.error('Public business info error:', error);
    return NextResponse.json(
      { error: 'Erro ao carregar dados do estabelecimento' },
      { status: 500 }
    );
  }
}

