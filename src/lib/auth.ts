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
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, userProfile: null, supabase };
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
    console.warn('Failed to fetch user profile:', error.message);
    return { user, userProfile: null, supabase };
  }

  return { user, userProfile, supabase };
}
