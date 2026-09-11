import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || '';
  const { pathname } = request.nextUrl;

  // If visiting web.liquidchat.online or web subdomain
  if (host.startsWith('web.')) {
    // Rewrite root path to /web
    if (pathname === '/') {
      const url = request.nextUrl.clone();
      url.pathname = '/web';
      return NextResponse.rewrite(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - uploads
     * - LiquidChat.apk
     */
    '/((?!api|_next/static|_next/image|favicon.ico|uploads|LiquidChat.apk).*)',
  ],
};

