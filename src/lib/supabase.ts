import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  // Cloudflare Pagesでは、環境変数は実行時にWorkerに渡される
  // 環境変数の読み込みを試行
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // デバッグログ（常に出力して環境変数の読み込み状況を確認）
  // Cloudflare Pagesでは、環境変数は実行時にWorkerに渡される
  // process.envの全キーを確認（機密情報は含まれないように注意）
  const allEnvKeys = Object.keys(process.env);
  const supabaseEnvKeys = allEnvKeys.filter(key => key.includes('SUPABASE'));
  
  console.log('Environment variables check:', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey,
    urlLength: supabaseUrl?.length || 0,
    keyLength: supabaseAnonKey?.length || 0,
    nodeEnv: process.env.NODE_ENV,
    supabaseEnvKeys: supabaseEnvKeys,
    totalEnvKeys: allEnvKeys.length,
    // デバッグ用：NEXT_PUBLIC_で始まる全てのキーを確認
    nextPublicKeys: allEnvKeys.filter(key => key.startsWith('NEXT_PUBLIC_')),
  });
  
  // より詳細なデバッグ情報（環境変数が存在するが値が空の場合を検出）
  if (supabaseEnvKeys.length > 0) {
    console.log('Found Supabase environment variable keys:', supabaseEnvKeys);
    supabaseEnvKeys.forEach(key => {
      const value = process.env[key];
      console.log(`  ${key}: ${value ? `exists (length: ${value.length})` : 'exists but is empty or undefined'}`);
    });
  } else {
    console.warn('No Supabase environment variables found in process.env');
    console.log('Available NEXT_PUBLIC_ keys:', allEnvKeys.filter(key => key.startsWith('NEXT_PUBLIC_')));
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    const errorMessage = `Missing Supabase environment variables. URL: ${supabaseUrl ? 'OK' : 'MISSING'}, Key: ${supabaseAnonKey ? 'OK' : 'MISSING'}`;
    console.error(errorMessage);
    throw new Error(errorMessage);
  }

  try {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
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

    // Supabaseクライアントの作成後に接続テストを実行（認証APIのみ）
    // エラーが発生した場合、ログに出力して原因を特定
    try {
      const { error: authTestError } = await supabase.auth.getUser();
      if (authTestError) {
        console.error('Supabase auth connection test failed:', {
          message: authTestError.message,
          code: authTestError.code,
          // AuthErrorにはdetailsとhintプロパティがないため、削除
        });
      } else {
        console.log('Supabase connection test: OK (auth endpoint accessible)');
      }
    } catch (testError) {
      // 接続テストのエラーは無視（クライアント自体は返す）
      console.warn('Supabase connection test error (non-fatal):', {
        error: testError instanceof Error ? testError.message : String(testError),
      });
    }

    return supabase;
  } catch (error) {
    // Supabaseクライアントの作成に失敗した場合
    console.error('Failed to create Supabase client:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      supabaseUrl: supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : 'MISSING',
      supabaseAnonKey: supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'MISSING',
    });
    throw error;
  }
}
