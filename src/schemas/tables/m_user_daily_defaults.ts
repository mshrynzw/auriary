import { z } from 'zod';
import { commonColumnsSchema, userIdSchema, levelSchema, timeStringSchema } from '../base';

/**
 * m_user_daily_defaults（日記のデフォルト設定）のデータベース行スキーマ
 */
export const userDailyDefaultsRowSchema = commonColumnsSchema.extend({
  user_id: userIdSchema,
  sleep_quality_default: levelSchema,
  wake_level_default: levelSchema,
  daytime_level_default: levelSchema,
  pre_sleep_level_default: levelSchema,
  med_adherence_level_default: levelSchema,
  appetite_level_default: levelSchema,
  sleep_desire_level_default: levelSchema,
  exercise_level_default: levelSchema,
  sleep_start_at_default: timeStringSchema,
  sleep_end_at_default: timeStringSchema,
  bath_start_at_default: timeStringSchema,
  bath_end_at_default: timeStringSchema,
});

/**
 * m_user_daily_defaults（日記のデフォルト設定）のアプリケーション用スキーマ
 */
export const userDailyDefaultsSchema = userDailyDefaultsRowSchema;

export type UserDailyDefaults = z.infer<typeof userDailyDefaultsSchema>;
export type UserDailyDefaultsRow = z.infer<typeof userDailyDefaultsRowSchema>;
