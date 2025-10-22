import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { auth } from '@/lib/firebase/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  let isAuthenticated = false;

  const sessionCookie = request.cookies.get('session')?.value;
  if (sessionCookie) {
    const { currentUser, error } = await auth.verifySessionCookie(sessionCookie, true);
    if (currentUser && !error) {
      isAuthenticated = true;
    } else {
      // If verification fails, treat as not authenticated and clear the invalid cookie
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('session');
      return response;
    }
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
