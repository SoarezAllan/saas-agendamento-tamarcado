import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { sendVerificationCodeEmail } from '@/lib/notifications';

export async function POST(req: NextRequest) {
  try {
    const { businessName, ownerName, email, password } = await req.json();

    if (!businessName || !ownerName || !email || !password) {
      return NextResponse.json(
        { error: 'Preencha todos os campos obrigatórios para receber o código.' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'A senha deve ter no mínimo 6 caracteres.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check if user email already exists
    const existingUser = await db.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Este e-mail já está cadastrado. Faça login para acessar seu painel.' },
        { status: 400 }
      );
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Remove any previous codes for this email
    await db.emailVerificationCode.deleteMany({
      where: { email: cleanEmail },
    });

    // Save new code
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
      userName: ownerName,
      code,
    });

    return NextResponse.json({
      success: true,
      message: `Código de verificação de 6 dígitos enviado para ${cleanEmail}!`,
    });
  } catch (error: any) {
    console.error('Send verification code error:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao enviar código de verificação' },
      { status: 500 }
    );
  }
}

