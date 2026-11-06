'use server';

import { requireAuth, getAuth } from '@/lib/auth';
import {
  createDiaryFormSchema,
  updateDiaryFormSchema,
  type CreateDiaryFormInput,
  type UpdateDiaryFormInput,
} from '@/schemas';
import { revalidatePath } from 'next/cache';
import { analyzeSentiment } from '@/lib/ai/sentiment-api';
import { getDatabase } from '@/lib/db';
import {
  findEarliestJournalDate,
  findOwnedDiary,
  insertDiary,
  listDiaries,
  softDeleteDiary,
  updateDiary,
} from '@/lib/diary-store';

/**
 * 日記を作成
 */
export async function createDiaryAction(input: CreateDiaryFormInput) {
  const { user } = await requireAuth();

  const validated = createDiaryFormSchema.safeParse(input);
  if (!validated.success) {
    return {
      error: {
        code: 'VALIDATION_ERROR',
        message: validated.error.issues[0].message,
      },
    };
  }

  const hasOd =
    validated.data.has_od || (validated.data.od_times && validated.data.od_times.length > 0);
  const hasAlcohol =
    validated.data.has_alcohol ||
    (validated.data.alcohol_times && validated.data.alcohol_times.length > 0);

  let moodScore: number | null = null;
  let sentimentAnalysisResult: unknown = null;
  if (validated.data.note && validated.data.note.trim().length > 0) {
    try {
      const sentimentResult = await analyzeSentiment(validated.data.note);
      moodScore = sentimentResult.score;
      sentimentAnalysisResult = {
        sentiment: sentimentResult.sentiment,
        score: sentimentResult.score,
        confidence: sentimentResult.confidence,
        highlighted_words: sentimentResult.highlighted_words,
        overall_sentiment_score: sentimentResult.overall_sentiment_score,
        model_used: sentimentResult.model_used,
      };
    } catch (error) {
      console.error('感情分析に失敗しました', error instanceof Error ? error.message : 'unknown');
    }
  }

  try {
    const db = await getDatabase();
    const created = await insertDiary(db, user.id, {
      ...validated.data,
      has_od: hasOd,
      has_alcohol: hasAlcohol,
      od_times:
        validated.data.od_times && validated.data.od_times.length > 0
          ? validated.data.od_times
          : null,
      alcohol_times:
        validated.data.alcohol_times && validated.data.alcohol_times.length > 0
          ? validated.data.alcohol_times
          : null,
      mood: moodScore,
      sentiment_analysis_result: sentimentAnalysisResult,
    });
    if (!created.ok) {
      return { error: { code: created.code, message: created.message } };
    }
    revalidatePath('/diary');
    revalidatePath('/dashboard');
    revalidatePath('/blood-pressure');
    return { diary: created.diary };
  } catch (error) {
    console.error('日記の作成に失敗しました', error instanceof Error ? error.message : 'unknown');
    return {
      error: {
        code: 'INTERNAL_ERROR',
        message: '日記の作成に失敗しました',
      },
    };
  }
}

/**
 * 日記を更新
 */
export async function updateDiaryAction(id: number, input: UpdateDiaryFormInput) {
  const { user } = await requireAuth();

  const validated = updateDiaryFormSchema.safeParse(input);
  if (!validated.success) {
    return {
      error: {
        code: 'VALIDATION_ERROR',
        message: validated.error.issues[0].message,
      },
    };
  }

  const updateData: Record<string, unknown> = { ...validated.data };
  if (updateData.od_times !== undefined) {
    const times = Array.isArray(updateData.od_times) ? updateData.od_times : [];
    updateData.has_od = times.length > 0;
    updateData.od_times = times.length > 0 ? times : null;
  } else if (updateData.has_od === false) {
    updateData.od_times = null;
  }
  if (updateData.alcohol_times !== undefined) {
    const times = Array.isArray(updateData.alcohol_times) ? updateData.alcohol_times : [];
    updateData.has_alcohol = times.length > 0;
    updateData.alcohol_times = times.length > 0 ? times : null;
  } else if (updateData.has_alcohol === false) {
    updateData.alcohol_times = null;
  }

  if (updateData.note !== undefined) {
    const note = typeof updateData.note === 'string' ? updateData.note : '';
    if (note.trim().length > 0) {
      try {
        const sentimentResult = await analyzeSentiment(note);
        updateData.mood = sentimentResult.score;
        updateData.sentiment_analysis_result = {
          sentiment: sentimentResult.sentiment,
          score: sentimentResult.score,
          confidence: sentimentResult.confidence,
          highlighted_words: sentimentResult.highlighted_words,
          overall_sentiment_score: sentimentResult.overall_sentiment_score,
          model_used: sentimentResult.model_used,
        };
      } catch (error) {
        console.error('感情分析に失敗しました', error instanceof Error ? error.message : 'unknown');
        if (note.trim().length === 0) {
          updateData.mood = null;
          updateData.sentiment_analysis_result = null;
        }
      }
    } else {
      updateData.mood = null;
      updateData.sentiment_analysis_result = null;
    }
  }

  try {
    const db = await getDatabase();
    const updated = await updateDiary(db, user.id, id, updateData);
    if (!updated.ok) {
      return { error: { code: updated.code, message: updated.message } };
    }
    revalidatePath('/diary');
    revalidatePath(`/diary/${id}`);
    revalidatePath('/dashboard');
    revalidatePath('/blood-pressure');
    return { diary: updated.diary };
  } catch (error) {
    console.error('日記の更新に失敗しました', error instanceof Error ? error.message : 'unknown');
    return {
      error: {
        code: 'INTERNAL_ERROR',
        message: '日記の更新に失敗しました',
      },
    };
  }
}

/**
 * 日記を削除（ソフトデリート）
 */
export async function deleteDiaryAction(id: number) {
  const { user } = await requireAuth();

  try {
    const db = await getDatabase();
    const deleted = await softDeleteDiary(db, user.id, id);
    if (!deleted.ok) {
      return { error: { code: deleted.code, message: deleted.message } };
    }
    revalidatePath('/diary');
    revalidatePath('/dashboard');
    revalidatePath('/blood-pressure');
    return { success: true };
  } catch (error) {
    console.error('日記の削除に失敗しました', error instanceof Error ? error.message : 'unknown');
    return {
      error: {
        code: 'INTERNAL_ERROR',
        message: '日記の削除に失敗しました',
      },
    };
  }
}

/**
 * ユーザーの最古の日記日付（無限スクロールの終了判定用）
 */
export async function getEarliestJournalDateAction(): Promise<{ journal_date: string | null }> {
  const { userProfile } = await getAuth();
  if (!userProfile) {
    return { journal_date: null };
  }

  try {
    const db = await getDatabase();
    return { journal_date: await findEarliestJournalDate(db, userProfile.id) };
  } catch (error) {
    console.error(
      '最古の日記日付の取得に失敗しました',
      error instanceof Error ? error.message : 'unknown',
    );
    return { journal_date: null };
  }
}

/**
 * 日記一覧を取得
 * 未認証の場合は空の配列を返す
 */
export async function getDiariesAction(params?: {
  start_date?: string;
  end_date?: string;
  keyword?: string;
  limit?: number;
  offset?: number;
}) {
  const { userProfile } = await getAuth();
  if (!userProfile) {
    return { diaries: [] };
  }

  try {
    const db = await getDatabase();
    return { diaries: await listDiaries(db, userProfile.id, params) };
  } catch (error) {
    console.error('日記の取得に失敗しました', error instanceof Error ? error.message : 'unknown');
    return {
      error: {
        code: 'INTERNAL_ERROR',
        message: '日記の取得に失敗しました',
      },
    };
  }
}

/**
 * 日記を取得（単一）
 * 未認証の場合はエラーを返す
 */
export async function getDiaryAction(id: number) {
  const { userProfile } = await getAuth();
  if (!userProfile) {
    return {
      error: {
        code: 'UNAUTHORIZED',
        message: '認証が必要です',
      },
    };
  }

  try {
    const db = await getDatabase();
    const diary = await findOwnedDiary(db, userProfile.id, id);
    if (!diary) {
      return {
        error: {
          code: 'NOT_FOUND',
          message: '日記が見つかりません',
        },
      };
    }
    return { diary };
  } catch (error) {
    console.error('日記の取得に失敗しました', error instanceof Error ? error.message : 'unknown');
    return {
      error: {
        code: 'NOT_FOUND',
        message: '日記が見つかりません',
      },
    };
  }
}
