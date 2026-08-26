import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { comparePassword, createAuthResponse, UserSession } from '@/lib/auth';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    const clientIp = getClientIp(req);

    // Rate limiting: 5 login attempts per minute per IP
    const rateCheck = checkRateLimit(`login_${clientIp}`, 5, 60 * 1000);
    if (!rateCheck.success) {
      const waitSeconds = Math.ceil((rateCheck.resetTime - Date.now()) / 1000);
      return NextResponse.json(
        { error: `Muitas tentativas de login. Por favor, aguarde ${waitSeconds} segundos antes de tentar novamente.` },
        { status: 429 }
      );
    }

    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'E-mail e senha são obrigatórios' },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: {
        business: true,
        professional: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Credenciais inválidas' },
        { status: 401 }
      );
    }

    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Credenciais inválidas' },
        { status: 401 }
      );
    }

    const session: UserSession = {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role as 'SUPERADMIN' | 'ADMIN' | 'PROFESSIONAL',
      businessId: user.businessId,
      professionalId: user.professionalId,
    };

    return createAuthResponse(
      {
        message: 'Login realizado com sucesso',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          business: user.business
            ? {
                id: user.business.id,
                name: user.business.name,
                slug: user.business.slug,
                category: user.business.category,
                primaryColor: user.business.primaryColor,
                logoUrl: user.business.logoUrl,
              }
            : null,
          professionalId: user.professionalId,
        },
      },
      session
    );
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Erro interno ao processar login' },
      { status: 500 }
    );
  }
}
