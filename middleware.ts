import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Bu middleware şimdilik basitleştirildi.
// Gerçek kimlik doğrulama istemci tarafında Firebase ile yapılacak.
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Kök dizini doğrudan dashboard'a yönlendir.
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Oturum kontrolü şimdilik kaldırıldı, istemci tarafı halledecek.
  // Gelişmiş senaryolar için burası Firebase Auth durumu ile senkronize edilebilir.

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/dashboard/:path*', '/login'],
}
