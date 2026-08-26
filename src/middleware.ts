import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('auth_token')?.value;

  // Protect /dashboard and /superadmin routes
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/superadmin')) {
    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // If already logged in and visiting /login or /register, allow them to proceed or let dashboard handle
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/superadmin/:path*',
  ],
};

