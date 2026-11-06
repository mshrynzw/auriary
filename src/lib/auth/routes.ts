/**
 * proxy が未認証・認証済みを振り分ける先。データは見ない。
 */

const PROTECTED_PREFIXES = ['/calendar', '/analytics', '/settings', '/blood-pressure'] as const;

export function requiresSession(pathname: string): boolean {
  if (PROTECTED_PREFIXES.some((path) => pathname.startsWith(path))) {
    return true;
  }
  if (pathname === '/diary/new') {
    return true;
  }
  return /^\/diary\/\d+\/edit$/.test(pathname);
}

/**
 * リダイレクト先。不要なら null。
 */
export function authRedirectTarget(
  pathname: string,
  isAuthenticated: boolean,
): '/login' | '/diary' | null {
  if (!isAuthenticated && requiresSession(pathname)) {
    return '/login';
  }
  if (isAuthenticated && (pathname === '/login' || pathname === '/register')) {
    return '/diary';
  }
  return null;
}
