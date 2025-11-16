import { createSupabaseServerClient } from './supabase';
import { redirect } from 'next/navigation';

/**
 * 認証が必要なページで使用するヘルパー関数
 * 未認証の場合は /login にリダイレクト
 */
export async function requireAuth() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/login');
  }

  // m_users テーブルからユーザー情報を取得
  const { data: userProfile, error: profileError } = await supabase
    .from('m_users')
    .select('id, display_name, email')
    .eq('auth_user_id', user.id)
    .eq('is_active', true)
    .is('deleted_at', null)
    .single();

  if (profileError) {
    console.error('Failed to fetch user profile:', profileError);
    throw new Error('ユーザープロフィールの取得に失敗しました');
  }

  if (!userProfile) {
    throw new Error('ユーザープロフィールが見つかりません');
  }

  return { user, userProfile, supabase };
}

/**
 * 認証状態を取得（リダイレクトしない）
 */
export async function getAuth() {
  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      console.error('Failed to get user from Supabase auth:', {
        message: authError.message,
        code: authError.code,
        // AuthErrorにはdetailsとhintプロパティがないため、削除
      });
      return { user: null, userProfile: null, supabase: null };
    }

    if (!user) {
      return { user: null, userProfile: null, supabase: null };
    }

    // m_users テーブルからユーザー情報を取得（エラー時はnullを返す）
    const { data: userProfile, error } = await supabase
      .from('m_users')
      .select('id, display_name, email')
      .eq('auth_user_id', user.id)
      .eq('is_active', true)
      .is('deleted_at', null)
      .single();

    // エラーが発生した場合（テーブルが存在しない、RLSポリシーの問題など）はnullを返す
    if (error) {
      console.warn('Failed to fetch user profile:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        // RLSエラーの可能性を確認
        isRLSError: error.code === 'PGRST301' || error.message?.includes('RLS'),
        // テーブルが存在しない可能性を確認
        isTableNotFound: error.code === 'PGRST116' || error.message?.includes('relation') || error.message?.includes('does not exist'),
      });
      return { user, userProfile: null, supabase };
    }

    return { user, userProfile, supabase };
  } catch (error) {
    // 環境変数が設定されていない場合など、Supabaseクライアントの作成に失敗した場合
    console.error('Failed to create Supabase client in getAuth():', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return { user: null, userProfile: null, supabase: null };
  }
}
