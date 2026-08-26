import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { signToken, UserSession } from '@/lib/auth';

function getSafeBaseUrl(req: NextRequest): string {
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || 'localhost:3000';
  const proto = req.headers.get('x-forwarded-proto') || (host.includes('loca.lt') ? 'https' : 'http');
  const safeHost = host.replace(/^0\.0\.0\.0(?::(\d+))?$/, (_, port) => `localhost${port ? `:${port}` : ''}`);
  return `${proto}://${safeHost}`;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const role = searchParams.get('role') || 'owner';
  const baseUrl = getSafeBaseUrl(req);

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
    return NextResponse.redirect(new URL(`${baseUrl}/login`));
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
  const targetPath = user.role === 'SUPERADMIN' ? '/superadmin' : '/dashboard';
  const response = NextResponse.redirect(new URL(`${baseUrl}${targetPath}`));

  response.cookies.set('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}
