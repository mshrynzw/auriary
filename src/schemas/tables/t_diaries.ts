import { z } from 'zod';
import {
  commonColumnsSchema,
  userIdSchema,
  levelSchema,
  moodSchema,
  medicationIdSchema,
} from '../base';

/**
 * OD情報の個別スキーマ
 * od_times配列の各要素の構造
 */
export const odTimeItemSchema = z.object({
  occurred_at: z.string().datetime(), // ISO8601 datetime string
  medication_id: medicationIdSchema.nullable(),
  medication_name: z.string().nullable(),
  amount: z.number().nullable(),
  amount_unit: z.string().nullable(),
  context_memo: z.string().nullable(),
  source_id: z.number().int().positive().nullable(),
});

export type OdTimeItem = z.infer<typeof odTimeItemSchema>;

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
  od_times: z.array(odTimeItemSchema).nullable(), // JSONB配列
  ai_summary: z.string().nullable(),
  ai_topics: z.record(z.string(), z.any()).nullable(), // JSONB
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
  od_times:
    data.od_times?.map((item) => ({
      ...item,
      occurred_at: new Date(item.occurred_at),
    })) ?? null,
}));

export type Diary = z.infer<typeof diarySchema>;
export type DiaryRow = z.infer<typeof diaryRowSchema>;
