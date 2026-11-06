'use server';

import { requireAuth } from '@/lib/auth';
import { analyzeSentimentMock, completeTextMock, extractTopicsMock } from '@/lib/ai/mock';
import { getDatabase } from '@/lib/db';
import { execute, isRecord, queryFirst, toSqlJson } from '@/lib/sql';

/**
 * 日記のAI分析を実行
 */
export async function analyzeDiaryAction(diaryId: number) {
  const { user } = await requireAuth();

  const db = await getDatabase();
  const diary = await queryFirst(
    db,
    'SELECT note FROM t_diaries WHERE id = ? AND user_id = ? AND deleted_at IS NULL',
    [diaryId, user.id],
  );
  if (!isRecord(diary) || typeof diary.note !== 'string' || diary.note.length === 0) {
    return {
      error: {
        code: 'NOT_FOUND',
        message: '日記が見つかりません',
      },
    };
  }

  const analysis = await analyzeSentimentMock(diary.note);
  await execute(
    db,
    'UPDATE t_diaries SET mood = ?, ai_summary = ?, ai_topics = ?, updated_at = ?, updated_by = ? WHERE id = ? AND user_id = ? AND deleted_at IS NULL',
    [
      analysis.score,
      analysis.summary,
      toSqlJson(analysis.topics),
      new Date().toISOString(),
      user.id,
      diaryId,
      user.id,
    ],
  );

  return { analysis };
}

/**
 * 文章補完を実行
 */
export async function completeTextAction(text: string): Promise<{ completed_text: string }> {
  await requireAuth();
  const completedText = await completeTextMock(text);
  return { completed_text: completedText };
}

/**
 * トピック抽出を実行
 */
export async function extractTopicsAction(text: string): Promise<{ topics: string[] }> {
  await requireAuth();
  const topics = await extractTopicsMock(text);
  return { topics };
}
