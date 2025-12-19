'use server';

import { requireAuth } from '@/lib/auth';
import { dailyDefaultsFormSchema, type DailyDefaultsFormInput } from '@/schemas';
import { revalidatePath } from 'next/cache';

/**
 * 日記のデフォルト設定を取得
 */
export async function getDailyDefaultsAction() {
  const { user, userProfile, supabase } = await requireAuth();

  const { data, error } = await supabase
    .from('m_user_daily_defaults')
    .select('*')
    .eq('user_id', userProfile!.id)
    .is('deleted_at', null)
    .single();

  if (error) {
    // レコードが存在しない場合はデフォルト値を返す
    if (error.code === 'PGRST116') {
      return {
        defaults: {
          sleep_quality_default: 5,
          wake_level_default: 5,
          daytime_level_default: 5,
          pre_sleep_level_default: 5,
          med_adherence_level_default: 5,
          appetite_level_default: 5,
          sleep_desire_level_default: 5,
          exercise_level_default: 5,
          sleep_start_at_default: null,
          sleep_end_at_default: null,
          bath_start_at_default: null,
          bath_end_at_default: null,
        },
      };
    }
    return {
      error: {
        code: 'INTERNAL_ERROR',
        message: 'デフォルト設定の取得に失敗しました',
      },
    };
  }

  return { defaults: data };
}

/**
 * 日記のデフォルト設定を保存
 */
export async function saveDailyDefaultsAction(input: DailyDefaultsFormInput) {
  const { user, userProfile, supabase } = await requireAuth();

  // バリデーション
  const validated = dailyDefaultsFormSchema.safeParse(input);
  if (!validated.success) {
    return {
      error: {
        code: 'VALIDATION_ERROR',
        message: validated.error.issues[0].message,
      },
    };
  }

  // 既存のレコードを確認
  const { data: existing } = await supabase
    .from('m_user_daily_defaults')
    .select('id')
    .eq('user_id', userProfile!.id)
    .is('deleted_at', null)
    .single();

  if (existing) {
    // 更新
    const { data, error } = await supabase
      .from('m_user_daily_defaults')
      .update({
        ...validated.data,
        updated_by: user.id,
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) {
      return {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'デフォルト設定の更新に失敗しました',
        },
      };
    }

    revalidatePath('/settings');
    return { defaults: data };
  } else {
    // 新規作成
    const { data, error } = await supabase
      .from('m_user_daily_defaults')
      .insert({
        user_id: userProfile!.id,
        ...validated.data,
        created_by: user.id,
        updated_by: user.id,
      })
      .select()
      .single();

    if (error) {
      return {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'デフォルト設定の作成に失敗しました',
        },
      };
    }

    revalidatePath('/settings');
    return { defaults: data };
  }
}
