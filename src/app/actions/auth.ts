'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { authenticateAccount, registerAccount } from '@/lib/auth/accounts';
import {
  SESSION_COOKIE,
  issueSession,
  revokeSession,
  sessionCookieAttributes,
} from '@/lib/auth/session';
import { getDatabase } from '@/lib/db';
import { loginFormSchema, registerFormSchema } from '@/schemas';

/**
 * ログイン
 */
export async function loginAction(formData: FormData) {
  const validated = loginFormSchema.safeParse({
    email: readField(formData, 'email'),
    password: readField(formData, 'password'),
  });
  if (!validated.success) {
    return {
      error: {
        code: 'VALIDATION_ERROR',
        message: validated.error.issues[0]?.message ?? '入力内容を確認してください',
      },
    };
  }

  try {
    const db = await getDatabase();
    const authenticated = await authenticateAccount(db, {
      email: validated.data.email,
      password: validated.data.password,
    });
    if (!authenticated.ok) {
      return {
        error: {
          code: 'AUTH_ERROR',
          message: authenticated.message,
        },
      };
    }

    const token = await issueSession(db, authenticated.user.id);
    await writeSessionCookie(token);
  } catch (error) {
    console.error('ログインに失敗しました', error instanceof Error ? error.message : 'unknown');
    return {
      error: {
        code: 'AUTH_ERROR',
        message: 'ログインに失敗しました',
      },
    };
  }

  revalidatePath('/');
  return { success: true, redirectTo: '/diary' };
}

/**
 * 新規登録
 */
export async function registerAction(formData: FormData) {
  const validated = registerFormSchema.safeParse({
    email: readField(formData, 'email'),
    password: readField(formData, 'password'),
    display_name: readField(formData, 'display_name'),
  });
  if (!validated.success) {
    return {
      error: {
        code: 'VALIDATION_ERROR',
        message: validated.error.issues[0]?.message ?? '入力内容を確認してください',
      },
    };
  }

  try {
    const db = await getDatabase();
    const registered = await registerAccount(db, {
      email: validated.data.email,
      password: validated.data.password,
      displayName: validated.data.display_name,
    });
    if (!registered.ok) {
      return {
        error: {
          code: 'AUTH_ERROR',
          message: registered.message,
        },
      };
    }

    const token = await issueSession(db, registered.user.id);
    await writeSessionCookie(token);
  } catch (error) {
    console.error('登録に失敗しました', error instanceof Error ? error.message : 'unknown');
    return {
      error: {
        code: 'INTERNAL_ERROR',
        message: '登録に失敗しました',
      },
    };
  }

  revalidatePath('/');
  return { success: true, redirectTo: '/diary' };
}

/**
 * ログアウト
 */
export async function logoutAction() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE.name)?.value;
    if (token) {
      const db = await getDatabase();
      await revokeSession(db, token);
    }
    await clearSessionCookie();
  } catch (error) {
    console.error('ログアウトに失敗しました', error instanceof Error ? error.message : 'unknown');
    await clearSessionCookie();
    return {
      error: {
        code: 'LOGOUT_ERROR',
        message: 'ログアウトに失敗しました',
      },
    };
  }

  revalidatePath('/');
  return { success: true, redirectTo: '/login' };
}

function readField(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === 'string' ? value : '';
}

async function writeSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE.name, token, sessionCookieAttributes());
}

async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE.name, '', {
    ...sessionCookieAttributes(),
    maxAge: 0,
  });
}
