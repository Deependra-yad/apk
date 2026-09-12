import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || '';
  const { pathname } = request.nextUrl;

  // 1. If visiting /web or /web/* on the main domain (e.g. liquidchat.online/web), redirect to https://web.liquidchat.online
  if (!host.startsWith('web.') && (pathname === '/web' || pathname.startsWith('/web/'))) {
    const subPath = pathname.replace(/^\/web/, '') || '/';
    const destination = `https://web.liquidchat.online${subPath}${request.nextUrl.search}`;
    return NextResponse.redirect(destination, 308);
  }

  // 2. If visiting web.liquidchat.online:
  if (host.startsWith('web.')) {
    // If user explicitly browses to /web on web.liquidchat.online, clean up to /
    if (pathname === '/web' || pathname.startsWith('/web/')) {
      const cleanPath = pathname.replace(/^\/web/, '') || '/';
      const cleanUrl = new URL(`${cleanPath}${request.nextUrl.search}`, request.url);
      return NextResponse.redirect(cleanUrl, 308);
    }

    // Rewrite root path / on web.liquidchat.online to the internal /web page
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
     * Match all request paths except for:
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
