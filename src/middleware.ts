import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function getSafeBaseUrl(req: NextRequest): string {
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || 'localhost:3000';
  const proto = req.headers.get('x-forwarded-proto') || (host.includes('loca.lt') ? 'https' : 'http');
  const safeHost = host.replace(/^0\.0\.0\.0(?::(\d+))?$/, (_, port) => `localhost${port ? `:${port}` : ''}`);
  return `${proto}://${safeHost}`;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('auth_token')?.value;

  // Protect /dashboard and /superadmin routes
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/superadmin')) {
    if (!token) {
      const baseUrl = getSafeBaseUrl(request);
      const loginUrl = new URL(`${baseUrl}/login?redirect=${encodeURIComponent(pathname)}`);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/superadmin/:path*',
  ],
};
