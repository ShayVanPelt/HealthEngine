import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import type { SessionData } from '@/lib/session';
import { sessionOptions } from '@/lib/session';

const PROTECTED = ['/dashboard', '/workouts', '/calories', '/weight'];
const AUTH_ONLY = ['/login'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // getIronSession works with request.cookies (ReadonlyRequestCookies) in Edge runtime
  const session = await getIronSession<SessionData>(request.cookies, sessionOptions);
  const isLoggedIn = session.isLoggedIn === true;

  const isProtected = PROTECTED.some((p) => pathname.startsWith(p));
  const isAuthRoute = AUTH_ONLY.some((p) => pathname.startsWith(p));

  if (isProtected && !isLoggedIn) {
    const url = new URL('/login', request.url);
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  if (isAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Skip static files, images, and API routes — only run on page routes
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
