import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if this is an admin route
  if (pathname.startsWith('/admin')) {
    // Skip auth check for login and register pages
    if (pathname === '/admin/login' || pathname === '/admin/register') {
      return NextResponse.next();
    }

    // Check for admin session cookie
    const hasSession = request.cookies.has('admin_session');

    if (!hasSession) {
      // No session - redirect to login
      const loginUrl = new URL('/admin/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/admin/:path*',
};
