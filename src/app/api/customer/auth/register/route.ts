import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { hashPassword, createAuthResponse } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, phone, email, password, code } = body;

    if (!name || !phone || !email || !password) {
      return NextResponse.json(
        { error: 'Preencha todos os campos obrigatórios (Nome, Telefone, E-mail e Senha).' },
        { status: 400 }
      );
    }

    if (!code || code.trim().length < 6) {
      return NextResponse.json(
        { error: 'Informe o código de verificação de 6 dígitos enviado para seu e-mail.' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'A senha deve ter no mínimo 6 caracteres.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.replace(/\D/g, '');

    if (cleanPhone.length < 10) {
      return NextResponse.json(
        { error: 'Informe um telefone/WhatsApp válido com DDD.' },
        { status: 400 }
      );
    }

    // Validate verification code
    const verification = await db.emailVerificationCode.findFirst({
      where: {
        email: cleanEmail,
        code: code.trim(),
        expiresAt: { gt: new Date() },
      },
    });

    if (!verification) {
      return NextResponse.json(
        { error: 'Código de verificação inválido ou expirado. Verifique os números ou solicite um novo código.' },
        { status: 400 }
      );
    }

    // Delete used code
    await db.emailVerificationCode.deleteMany({
      where: { email: cleanEmail },
    });

    // Check if email already exists
    const existing = await db.customer.findUnique({
      where: { email: cleanEmail },
    });

    if (existing && existing.passwordHash && existing.emailVerified) {
      return NextResponse.json(
        { error: 'Já existe uma conta cadastrada com este e-mail. Faça login para acessar seus agendamentos.' },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    let customer;
    if (existing) {
      customer = await db.customer.update({
        where: { id: existing.id },
        data: {
          name: name.trim(),
          phone: cleanPhone,
          passwordHash,
          emailVerified: true,
        },
      });
    } else {
      customer = await db.customer.create({
        data: {
          name: name.trim(),
          phone: cleanPhone,
          email: cleanEmail,
          passwordHash,
          emailVerified: true,
        },
      });
    }

    // Link any previous unlinked appointments by email or phone to this customer
    await db.appointment.updateMany({
      where: {
        OR: [
          { customerEmail: cleanEmail },
          { customerPhone: cleanPhone },
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
      email: customer.email || cleanEmail,
      name: customer.name,
      phone: customer.phone,
      role: 'CUSTOMER' as const,
    };

    return createAuthResponse(
      {
        message: 'Cadastro realizado com sucesso!',
        customer: {
          id: customer.id,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
        },
      },
      sessionPayload,
      201
    );
  } catch (error: any) {
    console.error('Customer register error:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao realizar cadastro de cliente' },
      { status: 500 }
    );
  }
}

