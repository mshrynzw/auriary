'use server';

import { createSupabaseServerClient } from '@/lib/supabase';
import { loginFormSchema, registerFormSchema } from '@/schemas';
import { revalidatePath } from 'next/cache';

/**
 * ログイン
 */
export async function loginAction(formData: FormData) {
  const rawData = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  };

  // バリデーション
  const validated = loginFormSchema.safeParse(rawData);
  if (!validated.success) {
    return {
      error: {
        code: 'VALIDATION_ERROR',
        message: validated.error.issues[0].message,
      },
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: validated.data.email,
    password: validated.data.password,
  });

  // デバッグログ
  console.log('loginAction() - Sign in result:', {
    hasUser: !!data?.user,
    userId: data?.user?.id,
    userEmail: data?.user?.email,
    hasError: !!error,
    errorMessage: error?.message,
    errorCode: error?.code,
  });

  if (error) {
    return {
      error: {
        code: 'AUTH_ERROR',
        message:
          error.message === 'Invalid login credentials'
            ? 'メールアドレスまたはパスワードが正しくありません'
            : error.message,
      },
    };
  }

  if (!data.user) {
    return {
      error: {
        code: 'AUTH_ERROR',
        message: 'ログインに失敗しました',
      },
    };
  }

  // m_users テーブルにユーザーが存在しない場合は作成
  const { data: existingUser } = await supabase
    .from('m_users')
    .select('id')
    .eq('auth_user_id', data.user.id)
    .single();

  if (!existingUser) {
    // 新規ユーザーを作成
    const { error: insertError } = await supabase.from('m_users').insert({
      auth_user_id: data.user.id,
      display_name: data.user.email?.split('@')[0] || 'ユーザー',
      email: data.user.email,
      is_active: true,
      created_by: data.user.id,
      updated_by: data.user.id,
    });

    if (insertError) {
      console.error('Failed to create user profile:', insertError);
      // ユーザープロフィール作成に失敗してもログインは成功しているので、続行
    }
  }

  revalidatePath('/');
  // redirect()の代わりに、成功レスポンスを返してクライアント側でリダイレクト
  // Cloudflare Workerプロキシ経由でredirect()が正しく処理されない場合があるため
  return { success: true, redirectTo: '/' };
}

/**
 * 新規登録
 */
export async function registerAction(formData: FormData) {
  const rawData = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    display_name: formData.get('display_name') as string,
  };

  // バリデーション
  const validated = registerFormSchema.safeParse(rawData);
  if (!validated.success) {
    return {
      error: {
        code: 'VALIDATION_ERROR',
        message: validated.error.issues[0].message,
      },
    };
  }

  const supabase = await createSupabaseServerClient();

  // Supabase Auth でユーザー作成
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: validated.data.email,
    password: validated.data.password,
  });

  if (authError) {
    return {
      error: {
        code: 'AUTH_ERROR',
        message:
          authError.message === 'User already registered'
            ? 'このメールアドレスは既に登録されています'
            : authError.message,
      },
    };
  }

  if (!authData.user) {
    return {
      error: {
        code: 'AUTH_ERROR',
        message: '登録に失敗しました',
      },
    };
  }

  // m_users テーブルにユーザープロフィールを作成
  const { error: profileError } = await supabase.from('m_users').insert({
    auth_user_id: authData.user.id,
    display_name: validated.data.display_name,
    email: validated.data.email,
    is_active: true,
    created_by: authData.user.id,
    updated_by: authData.user.id,
  });

  if (profileError) {
    console.error('Failed to create user profile:', profileError);
    return {
      error: {
        code: 'INTERNAL_ERROR',
        message: 'ユーザープロフィールの作成に失敗しました',
      },
    };
  }

  revalidatePath('/');
  // redirect()の代わりに、成功レスポンスを返してクライアント側でリダイレクト
  // Cloudflare Workerプロキシ経由でredirect()が正しく処理されない場合があるため
  return { success: true, redirectTo: '/' };
}

/**
 * ログアウト
 */
export async function logoutAction() {
  try {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();

    revalidatePath('/');
    // redirect()の代わりに、成功レスポンスを返してクライアント側でリダイレクト
    // Cloudflare Workerプロキシ経由でredirect()が正しく処理されない場合があるため
    return { success: true, redirectTo: '/login' };
  } catch (error) {
    console.error('Logout error:', error);
    // エラーが発生してもログアウト処理は続行
    return {
      error: {
        code: 'LOGOUT_ERROR',
        message: 'ログアウトに失敗しました',
      },
    };
  }
}
