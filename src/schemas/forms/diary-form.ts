import { z } from 'zod';
import { levelSchema } from '../base';

/**
 * 日記作成用フォームスキーマ
 */
export const createDiaryFormSchema = z.object({
  journal_date: z.string().date('有効な日付を入力してください'),
  note: z.string().max(10000, '日記本文は10000文字以下である必要があります').optional(),
  sleep_quality: levelSchema.optional(),
  wake_level: levelSchema.optional(),
  daytime_level: levelSchema.optional(),
  pre_sleep_level: levelSchema.optional(),
  med_adherence_level: levelSchema.optional(),
  appetite_level: levelSchema.optional(),
  sleep_desire_level: levelSchema.optional(),
  has_od: z.boolean().optional(),
  // datetime-local入力はブラウザが自動的に正しい形式を強制するため、バリデーション不要
  sleep_start_at: z.string().optional(),
  sleep_end_at: z.string().optional(),
  bath_start_at: z.string().optional(),
  bath_end_at: z.string().optional(),
});

/**
 * 日記更新用フォームスキーマ（すべてオプショナル）
 */
export const updateDiaryFormSchema = createDiaryFormSchema.partial();

export type CreateDiaryFormInput = z.infer<typeof createDiaryFormSchema>;
export type UpdateDiaryFormInput = z.infer<typeof updateDiaryFormSchema>;
