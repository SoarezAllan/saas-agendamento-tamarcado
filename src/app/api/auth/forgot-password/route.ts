import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import db from '@/lib/db';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { sendPasswordResetEmail } from '@/lib/notifications';

export async function POST(req: NextRequest) {
  try {
    const clientIp = getClientIp(req);

    // Rate limit: 3 recovery requests per 15 minutes per IP
    const rateCheck = checkRateLimit(`forgot_pw_${clientIp}`, 3, 15 * 60 * 1000);
    if (!rateCheck.success) {
      const waitMinutes = Math.ceil((rateCheck.resetTime - Date.now()) / (60 * 1000));
      return NextResponse.json(
        { error: `Muitas solicitações de recuperação. Por favor, aguarde ${waitMinutes} minutos antes de tentar novamente.` },
        { status: 429 }
      );
    }

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
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || req.headers.get('origin') || 'https://tamarcado-agendamento.com';
    const resetUrl = `${appUrl.replace(/\/$/, '')}/reset-password?token=${token}`;

    // Dispatch real HTML password reset email
    await sendPasswordResetEmail({
      to: normalizedEmail,
      userName: user.name,
      resetUrl,
    });

    console.log(`[PASSWORD RESET] E-mail sent to: ${normalizedEmail}`);

    return NextResponse.json({
      success: true,
      message: `Enviamos as instruções para o e-mail ${normalizedEmail}. Por favor, verifique sua caixa de entrada e a pasta de spam.`,
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Erro ao processar solicitação de recuperação de senha.' },
      { status: 500 }
    );
  }
}
