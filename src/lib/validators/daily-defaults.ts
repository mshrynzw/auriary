import { z } from 'zod';

// 時刻フィールドのバリデーション：空文字列をnullに変換し、HH:mm形式を検証
const timeFieldSchema = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((val) => (val === '' || val === null || val === undefined ? null : val))
  .refine(
    (val) => {
      if (val === null) return true;
      return /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/.test(val);
    },
    {
      message: '時刻はHH:mm形式で入力してください（例: 21:00）',
    },
  )
  .nullable()
  .optional();

export const dailyDefaultsSchema = z.object({
  sleep_quality_default: z.number().min(0).max(10),
  wake_level_default: z.number().min(0).max(10),
  daytime_level_default: z.number().min(0).max(10),
  pre_sleep_level_default: z.number().min(0).max(10),
  med_adherence_level_default: z.number().min(0).max(10),
  appetite_level_default: z.number().min(0).max(10),
  sleep_desire_level_default: z.number().min(0).max(10),
  exercise_level_default: z.number().min(0).max(10),
  sleep_start_at_default: timeFieldSchema,
  sleep_end_at_default: timeFieldSchema,
  bath_start_at_default: timeFieldSchema,
  bath_end_at_default: timeFieldSchema,
});

export type DailyDefaultsInput = z.infer<typeof dailyDefaultsSchema>;
