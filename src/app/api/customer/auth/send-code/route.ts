import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { sendVerificationCodeEmail } from '@/lib/notifications';

export async function POST(req: NextRequest) {
  try {
    const { email, name, phone } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Por favor, informe seu e-mail para receber o código.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check if customer is already registered with password
    const existing = await db.customer.findUnique({
      where: { email: cleanEmail },
    });

    if (existing && existing.passwordHash && existing.emailVerified) {
      return NextResponse.json(
        {
          isExistingUser: true,
          message: 'Você já possui uma conta cadastrada. Faça login com sua senha.',
        },
        { status: 200 }
      );
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Delete any old codes for this email
    await db.emailVerificationCode.deleteMany({
      where: { email: cleanEmail },
    });

    // Create new verification code record
    await db.emailVerificationCode.create({
      data: {
        email: cleanEmail,
        code,
        expiresAt,
      },
    });

    // Send email with the verification code
    await sendVerificationCodeEmail({
      to: cleanEmail,
      userName: name || 'Cliente',
      code,
    });

    return NextResponse.json({
      success: true,
      message: `Código de 6 dígitos enviado para ${cleanEmail}!`,
    });
  } catch (error: any) {
    console.error('Customer send verification code error:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao enviar código de verificação' },
      { status: 500 }
    );
  }
}
