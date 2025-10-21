import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { auth } from '@/lib/firebase/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  let isAuthenticated = false;
  try {
    const sessionCookie = request.cookies.get('session')?.value;
    if (sessionCookie) {
      const decodedIdToken = await auth.verifySessionCookie(sessionCookie, true);
      isAuthenticated = !!decodedIdToken;
    }
  } catch (error) {
    // Session cookie is invalid.
    isAuthenticated = false;
  }


  if (isAuthenticated && pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  if (!isAuthenticated && pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }


  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/dashboard/:path*', '/login'],
}
