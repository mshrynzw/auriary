'use server';

import { requireAuth } from '@/lib/auth';
import { dailyDefaultsFormSchema, type DailyDefaultsFormInput } from '@/schemas';
import { revalidatePath } from 'next/cache';
import { getDatabase } from '@/lib/db';
import { execute, isRecord, queryFirst } from '@/lib/sql';

type DailyDefaultsValues = {
  sleep_quality_default: number;
  bipolar_self_level_default: number;
  wake_level_default: number;
  daytime_level_default: number;
  pre_sleep_level_default: number;
  med_adherence_level_default: number;
  appetite_level_default: number;
  sleep_desire_level_default: number;
  exercise_level_default: number;
  sleep_start_at_default: string | null;
  sleep_end_at_default: string | null;
  bath_start_at_default: string | null;
  bath_end_at_default: string | null;
};

const EMPTY_DEFAULTS: DailyDefaultsValues = {
  sleep_quality_default: 5,
  bipolar_self_level_default: 5,
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
};

const DEFAULT_COLUMNS = [
  'sleep_quality_default',
  'bipolar_self_level_default',
  'wake_level_default',
  'daytime_level_default',
  'pre_sleep_level_default',
  'med_adherence_level_default',
  'appetite_level_default',
  'sleep_desire_level_default',
  'exercise_level_default',
  'sleep_start_at_default',
  'sleep_end_at_default',
  'bath_start_at_default',
  'bath_end_at_default',
] as const;

/**
 * 日記のデフォルト設定を取得
 */
export async function getDailyDefaultsAction() {
  const { userProfile } = await requireAuth();

  try {
    const db = await getDatabase();
    const row = await queryFirst(
      db,
      'SELECT * FROM m_user_daily_defaults WHERE user_id = ? AND deleted_at IS NULL',
      [userProfile.id],
    );
    if (!isRecord(row)) {
      return { defaults: EMPTY_DEFAULTS };
    }
    return { defaults: mapDefaults(row) };
  } catch (error) {
    console.error(
      'デフォルト設定の取得に失敗しました',
      error instanceof Error ? error.message : 'unknown',
    );
    return {
      error: {
        code: 'INTERNAL_ERROR',
        message: 'デフォルト設定の取得に失敗しました',
      },
    };
  }
}

/**
 * 日記のデフォルト設定を保存
 */
export async function saveDailyDefaultsAction(input: DailyDefaultsFormInput) {
  const { user } = await requireAuth();

  const validated = dailyDefaultsFormSchema.safeParse(input);
  if (!validated.success) {
    return {
      error: {
        code: 'VALIDATION_ERROR',
        message: validated.error.issues[0].message,
      },
    };
  }

  try {
    const db = await getDatabase();
    const existing = await queryFirst(
      db,
      'SELECT id FROM m_user_daily_defaults WHERE user_id = ? AND deleted_at IS NULL',
      [user.id],
    );
    const now = new Date().toISOString();
    const values = DEFAULT_COLUMNS.map((column) => {
      const value = validated.data[column];
      return value === undefined || value === '' ? null : value;
    });

    if (isRecord(existing) && typeof existing.id === 'number') {
      await execute(
        db,
        `UPDATE m_user_daily_defaults SET ${DEFAULT_COLUMNS.map((column) => `${column} = ?`).join(', ')}, updated_at = ?, updated_by = ? WHERE id = ? AND user_id = ?`,
        [...values, now, user.id, existing.id, user.id],
      );
    } else {
      await execute(
        db,
        `INSERT INTO m_user_daily_defaults (user_id, ${DEFAULT_COLUMNS.join(', ')}, created_at, updated_at, created_by, updated_by) VALUES (${[
          '?',
        ]
          .concat(DEFAULT_COLUMNS.map(() => '?'))
          .concat(['?', '?', '?', '?'])
          .join(', ')})`,
        [user.id, ...values, now, now, user.id, user.id],
      );
    }

    const saved = await queryFirst(
      db,
      'SELECT * FROM m_user_daily_defaults WHERE user_id = ? AND deleted_at IS NULL',
      [user.id],
    );
    revalidatePath('/settings');
    return { defaults: isRecord(saved) ? mapDefaults(saved) : EMPTY_DEFAULTS };
  } catch (error) {
    console.error(
      'デフォルト設定の保存に失敗しました',
      error instanceof Error ? error.message : 'unknown',
    );
    return {
      error: {
        code: 'INTERNAL_ERROR',
        message: 'デフォルト設定の保存に失敗しました',
      },
    };
  }
}

function mapDefaults(row: Record<string, unknown>): DailyDefaultsValues {
  const numberOr = (key: keyof DailyDefaultsValues, fallback: number) => {
    const value = row[key];
    return typeof value === 'number' ? value : fallback;
  };
  const textOrNull = (key: keyof DailyDefaultsValues) => {
    const value = row[key];
    return typeof value === 'string' && value.length > 0 ? value : null;
  };
  return {
    sleep_quality_default: numberOr('sleep_quality_default', 5),
    bipolar_self_level_default: numberOr('bipolar_self_level_default', 5),
    wake_level_default: numberOr('wake_level_default', 5),
    daytime_level_default: numberOr('daytime_level_default', 5),
    pre_sleep_level_default: numberOr('pre_sleep_level_default', 5),
    med_adherence_level_default: numberOr('med_adherence_level_default', 5),
    appetite_level_default: numberOr('appetite_level_default', 5),
    sleep_desire_level_default: numberOr('sleep_desire_level_default', 5),
    exercise_level_default: numberOr('exercise_level_default', 5),
    sleep_start_at_default: textOrNull('sleep_start_at_default'),
    sleep_end_at_default: textOrNull('sleep_end_at_default'),
    bath_start_at_default: textOrNull('bath_start_at_default'),
    bath_end_at_default: textOrNull('bath_end_at_default'),
  };
}
