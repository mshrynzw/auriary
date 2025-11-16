'use server';

import { requireAuth } from '@/lib/auth';
import { analyzeSentimentMock, completeTextMock, extractTopicsMock } from '@/lib/ai/mock';

/**
 * 日記のAI分析を実行
 */
export async function analyzeDiaryAction(diaryId: number) {
  const { userProfile, supabase } = await requireAuth();

  // 日記を取得
  const { data: diary, error } = await supabase
    .from('t_diaries')
    .select('note, journal_date')
    .eq('id', diaryId)
    .eq('user_id', userProfile!.id)
    .is('deleted_at', null)
    .single();

  if (error || !diary || !diary.note) {
    return {
      error: {
        code: 'NOT_FOUND',
        message: '日記が見つかりません',
      },
    };
  }

  // AI分析を実行（モック）
  const analysis = await analyzeSentimentMock(diary.note);

  // 分析結果をデータベースに保存
  const { user } = await requireAuth();
  const { error: updateError } = await supabase
    .from('t_diaries')
    .update({
      mood: analysis.score,
      ai_summary: analysis.summary,
      ai_topics: analysis.topics,
      updated_by: user.id,
    })
    .eq('id', diaryId);

  if (updateError) {
    return {
      error: {
        code: 'INTERNAL_ERROR',
        message: '分析結果の保存に失敗しました',
      },
    };
  }

  return { analysis };
}

/**
 * 文章補完を実行
 */
export async function completeTextAction(text: string): Promise<{ completed_text: string }> {
  await requireAuth();

  // モック実装
  const completedText = await completeTextMock(text);

  return { completed_text: completedText };
}

/**
 * トピック抽出を実行
 */
export async function extractTopicsAction(text: string): Promise<{ topics: string[] }> {
  await requireAuth();

  // モック実装
  const topics = await extractTopicsMock(text);

  return { topics };
}
