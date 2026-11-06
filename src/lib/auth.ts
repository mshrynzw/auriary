import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { findActiveUserById, type SessionUser } from './auth/accounts';
import { SESSION_COOKIE, verifySession } from './auth/session';
import { getDatabase } from './db';

export type { SessionUser };

/**
 * 認証が必要なページで使用する。未認証なら /login へ送る。
 */
export async function requireAuth() {
  const current = await readCurrentUser();
  if (!current) {
    redirect('/login');
  }

  return {
    user: current,
    userProfile: current,
  };
}

/**
 * 画面表示用の認証状態。セッションは D1 で検証する。
 */
export async function getAuth() {
  try {
    const current = await readCurrentUser();
    if (!current) {
      return { user: null, userProfile: null };
    }
    return { user: current, userProfile: current };
  } catch (error) {
    console.error(
      '認証状態の取得に失敗しました',
      error instanceof Error ? error.message : 'unknown',
    );
    return { user: null, userProfile: null };
  }
}

/**
 * 保存や削除の前に使う。getAuth と同じく D1 のセッションを検証する。
 */
export async function getAuthWithVerification() {
  return getAuth();
}

async function readCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE.name)?.value;
  if (!token) {
    return null;
  }

  const db = await getDatabase();
  const userId = await verifySession(db, token);
  if (!userId) {
    return null;
  }
  return findActiveUserById(db, userId);
}
