import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { comparePassword, createAuthResponse } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { login, password } = body;

    if (!login || !password) {
      return NextResponse.json(
        { error: 'Informe seu e-mail ou WhatsApp e a sua senha.' },
        { status: 400 }
      );
    }

    const cleanInput = login.trim().toLowerCase();
    const cleanPhone = login.replace(/\D/g, '');

    // Search by email or phone
    const customer = await db.customer.findFirst({
      where: {
        OR: [
          { email: cleanInput },
          ...(cleanPhone.length >= 10 ? [{ phone: cleanPhone }] : []),
        ],
      },
    });

    if (!customer || !customer.passwordHash) {
      return NextResponse.json(
        { error: 'Credenciais inválidas ou conta não cadastrada com senha.' },
        { status: 401 }
      );
    }

    const isValid = await comparePassword(password, customer.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Senha incorreta. Verifique os dados e tente novamente.' },
        { status: 401 }
      );
    }

    // Link any appointments with customer phone/email that don't have customerId yet
    await db.appointment.updateMany({
      where: {
        OR: [
          ...(customer.email ? [{ customerEmail: customer.email }] : []),
          { customerPhone: customer.phone },
        ],
        customerId: null,
      },
      data: {
        customerId: customer.id,
      },
    });

    const sessionPayload = {
      userId: customer.id,
      customerId: customer.id,
      email: customer.email || '',
      name: customer.name,
      phone: customer.phone,
      role: 'CUSTOMER' as const,
    };

    return createAuthResponse(
      {
        message: 'Login realizado com sucesso!',
        customer: {
          id: customer.id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
        },
      },
      sessionPayload,
      200
    );
  } catch (error: any) {
    console.error('Customer login error:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao realizar login de cliente' },
      { status: 500 }
    );
  }
}

