import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

describe('日記機能の結合テスト', () => {
  let supabase: ReturnType<typeof createClient>;
  let testUserEmail: string;
  let testUserPassword: string;
  let userId: string;
  let userProfileId: number;

  beforeAll(async () => {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
    testUserEmail = `test-diary-${Date.now()}@example.com`;
    testUserPassword = 'testpassword123';

    // テストユーザーを作成
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testUserEmail,
      password: testUserPassword,
    });

    if (authError || !authData.user) {
      throw new Error('テストユーザーの作成に失敗しました');
    }

    userId = authData.user.id;

    // m_users テーブルにユーザープロフィールを作成
    const { data: profileData, error: profileError } = await supabase
      .from('m_users')
      .insert({
        auth_user_id: userId,
        display_name: 'Test User',
        email: testUserEmail,
        is_active: true,
        created_by: userId,
        updated_by: userId,
      })
      .select('id')
      .single();

    if (profileError || !profileData) {
      throw new Error('ユーザープロフィールの作成に失敗しました');
    }

    userProfileId = profileData.id;
  });

  afterAll(async () => {
    // テストデータのクリーンアップ
    if (userProfileId) {
      await supabase.from('t_diaries').delete().eq('user_id', userProfileId);

      await supabase.from('m_users').delete().eq('id', userProfileId);
    }
  });

  it('日記を作成できる', async () => {
    const diaryData = {
      user_id: userProfileId,
      journal_date: '2025-01-10',
      note: 'テスト日記',
      sleep_quality: 5,
      wake_level: 4,
      created_by: userId,
      updated_by: userId,
    };

    const { data, error } = await supabase.from('t_diaries').insert(diaryData).select().single();

    expect(error).toBeNull();
    expect(data).toBeTruthy();
    expect(data.journal_date).toBe('2025-01-10');
    expect(data.note).toBe('テスト日記');
    expect(data.sleep_quality).toBe(5);
  });

  it('日記を取得できる', async () => {
    const { data, error } = await supabase
      .from('t_diaries')
      .select('*')
      .eq('user_id', userProfileId)
      .eq('journal_date', '2025-01-10')
      .single();

    expect(error).toBeNull();
    expect(data).toBeTruthy();
    expect(data.journal_date).toBe('2025-01-10');
  });

  it('日記を更新できる', async () => {
    const { data: existingDiary } = await supabase
      .from('t_diaries')
      .select('id')
      .eq('user_id', userProfileId)
      .eq('journal_date', '2025-01-10')
      .single();

    if (!existingDiary) {
      throw new Error('テスト用の日記が見つかりません');
    }

    const { data, error } = await supabase
      .from('t_diaries')
      .update({
        note: '更新された日記',
        sleep_quality: 4,
        updated_by: userId,
      })
      .eq('id', existingDiary.id)
      .select()
      .single();

    expect(error).toBeNull();
    expect(data).toBeTruthy();
    expect(data.note).toBe('更新された日記');
    expect(data.sleep_quality).toBe(4);
  });

  it('同じ日付の日記を重複作成できない（ユニーク制約）', async () => {
    const diaryData = {
      user_id: userProfileId,
      journal_date: '2025-01-10', // 既存の日記と同じ日付
      note: '重複テスト',
      created_by: userId,
      updated_by: userId,
    };

    const { data, error } = await supabase.from('t_diaries').insert(diaryData).select().single();

    expect(error).toBeTruthy();
    expect(data).toBeNull();
  });
});
