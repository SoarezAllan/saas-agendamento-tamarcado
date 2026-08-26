import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { hashPassword } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { error: 'Token de recuperação inválido ou ausente.' },
        { status: 400 }
      );
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return NextResponse.json(
        { error: 'A nova senha deve conter no mínimo 6 caracteres.' },
        { status: 400 }
      );
    }

    // Verify token in database
    const resetRecord = await db.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetRecord) {
      return NextResponse.json(
        { error: 'O link de recuperação é inválido ou já foi utilizado.' },
        { status: 400 }
      );
    }

    // Check expiration
    if (new Date() > new Date(resetRecord.expiresAt)) {
      await db.passwordResetToken.delete({ where: { token } });
      return NextResponse.json(
        { error: 'Este link de recuperação expirou. Por favor, solicite um novo.' },
        { status: 400 }
      );
    }

    // Find the user by email
    const user = await db.user.findUnique({
      where: { email: resetRecord.email },
    });

    if (!user) {
      await db.passwordResetToken.delete({ where: { token } });
      return NextResponse.json(
        { error: 'Usuário associado a este token não foi encontrado.' },
        { status: 404 }
      );
    }

    // Hash new password and update user
    const newPasswordHash = await hashPassword(password);

    await db.user.update({
      where: { id: user.id },
      data: { passwordHash: newPasswordHash },
    });

    // Delete token after successful reset
    await db.passwordResetToken.deleteMany({
      where: { email: resetRecord.email },
    });

    return NextResponse.json({
      message: 'Sua senha foi redefinida com sucesso! Você já pode fazer login com sua nova credencial.',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: 'Erro ao redefinir senha. Tente novamente.' },
      { status: 500 }
    );
  }
}
