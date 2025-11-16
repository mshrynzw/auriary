import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  // Cloudflare Pagesでは、環境変数は実行時にWorkerに渡される
  // 環境変数の読み込みを試行
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // デバッグログ（本番環境では削除可能）
  if (process.env.NODE_ENV !== 'production' || process.env.DEBUG) {
    console.log('Environment variables check:', {
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseAnonKey,
      urlLength: supabaseUrl?.length || 0,
      keyLength: supabaseAnonKey?.length || 0,
    });
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    const errorMessage = `Missing Supabase environment variables. URL: ${supabaseUrl ? 'OK' : 'MISSING'}, Key: ${supabaseAnonKey ? 'OK' : 'MISSING'}`;
    console.error(errorMessage);
    throw new Error(errorMessage);
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: any) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch (error) {
          // Cookie設定エラーは無視（Middlewareなどで既に設定されている場合）
        }
      },
      remove(name: string, options: any) {
        try {
          cookieStore.set({ name, value: '', ...options });
        } catch (error) {
          // Cookie削除エラーは無視
        }
      },
    },
  });
}
