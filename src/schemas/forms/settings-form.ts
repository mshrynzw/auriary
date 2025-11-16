import { z } from 'zod';
import { levelSchema, timeStringSchema } from '../base';

/**
 * 日記のデフォルト設定用フォームスキーマ
 */
export const dailyDefaultsFormSchema = z.object({
  sleep_quality_default: levelSchema,
  wake_level_default: levelSchema,
  daytime_level_default: levelSchema,
  pre_sleep_level_default: levelSchema,
  med_adherence_level_default: levelSchema,
  appetite_level_default: levelSchema,
  sleep_desire_level_default: levelSchema,
  sleep_start_at_default: timeStringSchema,
  sleep_end_at_default: timeStringSchema,
  bath_start_at_default: timeStringSchema,
  bath_end_at_default: timeStringSchema,
});

export type DailyDefaultsFormInput = z.infer<typeof dailyDefaultsFormSchema>;

