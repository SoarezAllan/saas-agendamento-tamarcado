import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { signToken, UserSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const role = searchParams.get('role') || 'owner';

  let email = 'admin@barbearia.com';
  if (role === 'professional') {
    email = 'carlos@barbearia.com';
  } else if (role === 'superadmin') {
    email = 'superadmin@saas.com';
  }

  const user = await db.user.findUnique({
    where: { email },
    include: {
      business: true,
      professional: true,
    },
  });

  if (!user) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  const session: UserSession = {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role as 'SUPERADMIN' | 'ADMIN' | 'PROFESSIONAL',
    businessId: user.businessId,
    professionalId: user.professionalId,
  };

  const token = signToken(session);
  const targetUrl = user.role === 'SUPERADMIN' ? '/superadmin' : '/dashboard';
  const response = NextResponse.redirect(new URL(targetUrl, req.url));

  response.cookies.set('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}
