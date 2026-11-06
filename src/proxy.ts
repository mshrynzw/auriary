import { NextResponse, type NextRequest } from 'next/server';
import { authRedirectTarget } from '@/lib/auth/routes';
import { SESSION_COOKIE, sessionCookieAttributes, verifySession } from '@/lib/auth/session';
import { getDatabase } from '@/lib/db';

export async function proxy(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE.name)?.value ?? '';
  let isAuthenticated = false;

  if (token) {
    try {
      const db = await getDatabase();
      isAuthenticated = (await verifySession(db, token)) !== null;
    } catch (error) {
      console.error(
        'セッションの検証に失敗しました',
        error instanceof Error ? error.message : 'unknown',
      );
      isAuthenticated = false;
    }
  }

  const pathname = request.nextUrl.pathname;
  const target = authRedirectTarget(pathname, isAuthenticated);

  if (target) {
    const redirectUrl = new URL(target, request.url);
    if (target === '/login') {
      redirectUrl.searchParams.set('redirect', pathname);
    }
    const redirectResponse = NextResponse.redirect(redirectUrl);
    redirectResponse.headers.set('x-pathname', target);
    if (token && !isAuthenticated) {
      clearSessionCookie(redirectResponse);
    }
    return redirectResponse;
  }

  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });
  response.headers.set('x-pathname', pathname);
  if (token && !isAuthenticated) {
    clearSessionCookie(response);
  }
  return response;
}

function clearSessionCookie(response: NextResponse): void {
  const attributes = sessionCookieAttributes();
  response.cookies.set({
    name: SESSION_COOKIE.name,
    value: '',
    httpOnly: attributes.httpOnly,
    secure: attributes.secure,
    sameSite: attributes.sameSite,
    path: attributes.path,
    maxAge: 0,
  });
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
