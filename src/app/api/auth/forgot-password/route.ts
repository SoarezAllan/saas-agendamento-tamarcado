import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import db from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Por favor, informe um endereço de e-mail válido.' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if user exists
    const user = await db.user.findUnique({
      where: { email: normalizedEmail },
    });

    // If user does not exist, return a generic success message to prevent user enumeration
    if (!user) {
      return NextResponse.json({
        message: 'Se este e-mail estiver cadastrado, você receberá o link para redefinir sua senha.',
      });
    }

    // Clean up any existing tokens for this email
    await db.passwordResetToken.deleteMany({
      where: { email: normalizedEmail },
    });

    // Generate secure random token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await db.passwordResetToken.create({
      data: {
        email: normalizedEmail,
        token,
        expiresAt,
      },
    });

    // Origin resolution
    const origin = req.headers.get('origin') || req.headers.get('referer')?.split('?')[0].replace(/\/$/, '') || 'http://localhost:3000';
    const resetUrl = `${origin}/reset-password?token=${token}`;

    console.log(`\n========================================`);
    console.log(`[PASSWORD RESET] E-mail: ${normalizedEmail}`);
    console.log(`[PASSWORD RESET] Reset URL: ${resetUrl}`);
    console.log(`========================================\n`);

    return NextResponse.json({
      message: 'Instruções para redefinição de senha enviadas com sucesso!',
      resetUrl, // Provided in JSON response for dev convenience and preview
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Erro ao processar solicitação de recuperação de senha.' },
      { status: 500 }
    );
  }
}

