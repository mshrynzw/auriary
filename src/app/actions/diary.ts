'use server';

import { requireAuth } from '@/lib/auth';
import {
  createDiaryFormSchema,
  updateDiaryFormSchema,
  type CreateDiaryFormInput,
  type UpdateDiaryFormInput,
} from '@/schemas';
import { revalidatePath } from 'next/cache';

/**
 * 日記を作成
 */
export async function createDiaryAction(input: CreateDiaryFormInput) {
  const { user, userProfile, supabase } = await requireAuth();

  // バリデーション
  const validated = createDiaryFormSchema.safeParse(input);
  if (!validated.success) {
    return {
      error: {
        code: 'VALIDATION_ERROR',
        message: validated.error.issues[0].message,
      },
    };
  }

  // od_timesが存在する場合、has_odを自動設定
  const hasOd =
    validated.data.has_od || (validated.data.od_times && validated.data.od_times.length > 0);

  // 日記を作成
  const { data, error } = await supabase
    .from('t_diaries')
    .insert({
      user_id: userProfile!.id,
      journal_date: validated.data.journal_date,
      note: validated.data.note,
      sleep_quality: validated.data.sleep_quality,
      wake_level: validated.data.wake_level,
      daytime_level: validated.data.daytime_level,
      pre_sleep_level: validated.data.pre_sleep_level,
      med_adherence_level: validated.data.med_adherence_level,
      appetite_level: validated.data.appetite_level,
      sleep_desire_level: validated.data.sleep_desire_level,
      exercise_level: validated.data.exercise_level,
      has_od: hasOd,
      od_times:
        validated.data.od_times && validated.data.od_times.length > 0
          ? validated.data.od_times
          : null,
      sleep_start_at: validated.data.sleep_start_at,
      sleep_end_at: validated.data.sleep_end_at,
      bath_start_at: validated.data.bath_start_at,
      bath_end_at: validated.data.bath_end_at,
      created_by: user.id,
      updated_by: user.id,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      // ユニーク制約違反（同じ日付の日記が既に存在）
      return {
        error: {
          code: 'DUPLICATE_ERROR',
          message: 'この日付の日記は既に存在します',
        },
      };
    }
    return {
      error: {
        code: 'INTERNAL_ERROR',
        message: '日記の作成に失敗しました',
      },
    };
  }

  revalidatePath('/diary');
  return { diary: data };
}

/**
 * 日記を更新
 */
export async function updateDiaryAction(id: number, input: UpdateDiaryFormInput) {
  const { user, userProfile, supabase } = await requireAuth();

  // バリデーション
  const validated = updateDiaryFormSchema.safeParse(input);
  if (!validated.success) {
    return {
      error: {
        code: 'VALIDATION_ERROR',
        message: validated.error.issues[0].message,
      },
    };
  }

  // 日記が存在し、ユーザーが所有しているか確認
  const { data: existingDiary, error: fetchError } = await supabase
    .from('t_diaries')
    .select('id, user_id')
    .eq('id', id)
    .eq('user_id', userProfile!.id)
    .is('deleted_at', null)
    .single();

  if (fetchError || !existingDiary) {
    return {
      error: {
        code: 'NOT_FOUND',
        message: '日記が見つかりません',
      },
    };
  }

  // od_timesが存在する場合、has_odを自動設定
  const updateData: any = { ...validated.data };
  if (updateData.od_times !== undefined) {
    updateData.has_od = updateData.od_times && updateData.od_times.length > 0;
    // od_timesが空の場合はnullに設定
    if (!updateData.od_times || updateData.od_times.length === 0) {
      updateData.od_times = null;
    }
  } else if (updateData.has_od !== undefined && !updateData.has_od) {
    // has_odがfalseに設定された場合、od_timesもクリア
    updateData.od_times = null;
  }

  // 日記を更新
  const { data, error } = await supabase
    .from('t_diaries')
    .update({
      ...updateData,
      updated_by: user.id,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return {
      error: {
        code: 'INTERNAL_ERROR',
        message: '日記の更新に失敗しました',
      },
    };
  }

  revalidatePath('/diary');
  revalidatePath(`/diary/${id}`);
  return { diary: data };
}

/**
 * 日記を削除（ソフトデリート）
 */
export async function deleteDiaryAction(id: number) {
  const { user, userProfile, supabase } = await requireAuth();

  // 日記が存在し、ユーザーが所有しているか確認
  const { data: existingDiary, error: fetchError } = await supabase
    .from('t_diaries')
    .select('id, user_id')
    .eq('id', id)
    .eq('user_id', userProfile!.id)
    .is('deleted_at', null)
    .single();

  if (fetchError || !existingDiary) {
    return {
      error: {
        code: 'NOT_FOUND',
        message: '日記が見つかりません',
      },
    };
  }

  // ソフトデリート
  const { error } = await supabase
    .from('t_diaries')
    .update({
      deleted_at: new Date().toISOString(),
      deleted_by: user.id,
    })
    .eq('id', id);

  if (error) {
    return {
      error: {
        code: 'INTERNAL_ERROR',
        message: '日記の削除に失敗しました',
      },
    };
  }

  revalidatePath('/diary');
  return { success: true };
}

/**
 * 日記一覧を取得
 */
export async function getDiariesAction(params?: {
  start_date?: string;
  end_date?: string;
  limit?: number;
  offset?: number;
}) {
  const { userProfile, supabase } = await requireAuth();

  let query = supabase
    .from('t_diaries')
    .select('*')
    .eq('user_id', userProfile!.id)
    .is('deleted_at', null)
    .order('journal_date', { ascending: false });

  if (params?.start_date) {
    query = query.gte('journal_date', params.start_date);
  }
  if (params?.end_date) {
    query = query.lte('journal_date', params.end_date);
  }

  if (params?.limit) {
    query = query.limit(params.limit);
  }
  if (params?.offset) {
    query = query.range(params.offset, params.offset + (params.limit || 20) - 1);
  }

  const { data, error } = await query;

  if (error) {
    return {
      error: {
        code: 'INTERNAL_ERROR',
        message: '日記の取得に失敗しました',
      },
    };
  }

  return { diaries: data || [] };
}

/**
 * 日記を取得（単一）
 */
export async function getDiaryAction(id: number) {
  const { userProfile, supabase } = await requireAuth();

  const { data, error } = await supabase
    .from('t_diaries')
    .select('*')
    .eq('id', id)
    .eq('user_id', userProfile!.id)
    .is('deleted_at', null)
    .single();

  if (error || !data) {
    return {
      error: {
        code: 'NOT_FOUND',
        message: '日記が見つかりません',
      },
    };
  }

  return { diary: data };
}
