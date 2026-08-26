import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ valid: false, error: 'Token não fornecido' }, { status: 400 });
    }

    const resetRecord = await db.passwordResetToken.findUnique({
      where: { token },
    });

    if (!resetRecord) {
      return NextResponse.json({ valid: false, error: 'Link de recuperação inválido ou expirado.' });
    }

    if (new Date() > new Date(resetRecord.expiresAt)) {
      return NextResponse.json({ valid: false, error: 'Este link de recuperação expirou.' });
    }

    return NextResponse.json({
      valid: true,
      email: resetRecord.email,
    });
  } catch (error) {
    console.error('Verify reset token error:', error);
    return NextResponse.json({ valid: false, error: 'Erro ao verificar token' }, { status: 500 });
  }
}
