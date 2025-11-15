import { describe, it, expect, beforeAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

// Supabase Local用のクライアント
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

describe('認証機能の結合テスト', () => {
  let supabase: ReturnType<typeof createClient>;
  let testUserEmail: string;
  let testUserPassword: string;

  beforeAll(() => {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
    testUserEmail = `test-${Date.now()}@example.com`;
    testUserPassword = 'testpassword123';
  });

  it('新規ユーザー登録が成功する', async () => {
    const { data, error } = await supabase.auth.signUp({
      email: testUserEmail,
      password: testUserPassword,
    });

    expect(error).toBeNull();
    expect(data.user).toBeTruthy();
    expect(data.user?.email).toBe(testUserEmail);
  });

  it('登録したユーザーでログインが成功する', async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: testUserEmail,
      password: testUserPassword,
    });

    expect(error).toBeNull();
    expect(data.user).toBeTruthy();
    expect(data.user?.email).toBe(testUserEmail);
  });

  it('無効なパスワードでログインが失敗する', async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: testUserEmail,
      password: 'wrongpassword',
    });

    expect(error).toBeTruthy();
    expect(data.user).toBeNull();
  });

  it('存在しないユーザーでログインが失敗する', async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'nonexistent@example.com',
      password: 'password123',
    });

    expect(error).toBeTruthy();
    expect(data.user).toBeNull();
  });
});

