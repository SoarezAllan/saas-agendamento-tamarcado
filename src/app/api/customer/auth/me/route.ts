import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import db from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession(req);
    if (!session || session.role !== 'CUSTOMER') {
      return NextResponse.json({ error: 'Não autenticado como cliente' }, { status: 401 });
    }

    const customer = await db.customer.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    if (!customer) {
      return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 });
    }

    return NextResponse.json({ customer });
  } catch (error: any) {
    console.error('Customer auth me error:', error);
    return NextResponse.json({ error: 'Erro ao obter dados do cliente' }, { status: 500 });
  }
}
