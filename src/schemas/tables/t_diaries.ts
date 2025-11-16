import { z } from 'zod';
import { commonColumnsSchema, userIdSchema, levelSchema, moodSchema } from '../base';

/**
 * t_diaries（日記・日次記録）のデータベース行スキーマ
 * Supabaseから取得した生データ用
 */
export const diaryRowSchema = commonColumnsSchema.extend({
  user_id: userIdSchema,
  journal_date: z.string().date(),
  sleep_start_at: z.string().datetime().nullable(),
  sleep_end_at: z.string().datetime().nullable(),
  bath_start_at: z.string().datetime().nullable(),
  bath_end_at: z.string().datetime().nullable(),
  sleep_quality: levelSchema.nullable(),
  wake_level: levelSchema.nullable(),
  daytime_level: levelSchema.nullable(),
  pre_sleep_level: levelSchema.nullable(),
  med_adherence_level: levelSchema.nullable(),
  appetite_level: levelSchema.nullable(),
  sleep_desire_level: levelSchema.nullable(),
  note: z.string().nullable(),
  has_od: z.boolean().nullable(),
  ai_summary: z.string().nullable(),
  ai_topics: z.record(z.any()).nullable(), // JSONB
  mood: moodSchema.nullable(),
});

/**
 * t_diaries（日記・日次記録）のアプリケーション用スキーマ
 * Dateオブジェクトに変換
 */
export const diarySchema = diaryRowSchema.transform((data) => ({
  ...data,
  journal_date: new Date(data.journal_date),
  sleep_start_at: data.sleep_start_at ? new Date(data.sleep_start_at) : null,
  sleep_end_at: data.sleep_end_at ? new Date(data.sleep_end_at) : null,
  bath_start_at: data.bath_start_at ? new Date(data.bath_start_at) : null,
  bath_end_at: data.bath_end_at ? new Date(data.bath_end_at) : null,
}));

export type Diary = z.infer<typeof diarySchema>;
export type DiaryRow = z.infer<typeof diaryRowSchema>;
