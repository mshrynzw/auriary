import { z } from 'zod';

export const createDiarySchema = z.object({
  journal_date: z.string().date('有効な日付を入力してください'), // ISO8601 date string (e.g. "2025-01-10")
  note: z.string().max(10000, '日記本文は10000文字以下である必要があります').optional(),
  sleep_quality: z.number().min(1).max(5).optional(),
  wake_level: z.number().min(1).max(5).optional(),
  daytime_level: z.number().min(1).max(5).optional(),
  pre_sleep_level: z.number().min(1).max(5).optional(),
  med_adherence_level: z.number().min(1).max(5).optional(),
  appetite_level: z.number().min(1).max(5).optional(),
  sleep_desire_level: z.number().min(1).max(5).optional(),
  exercise_level: z.number().min(1).max(5).optional(),
  has_od: z.boolean().optional(),
  // datetime-local入力はブラウザが自動的に正しい形式を強制するため、バリデーション不要
  sleep_start_at: z.string().optional(),
  sleep_end_at: z.string().optional(),
  bath_start_at: z.string().optional(),
  bath_end_at: z.string().optional(),
});

export const updateDiarySchema = createDiarySchema.partial();

export type CreateDiaryInput = z.infer<typeof createDiarySchema>;
export type UpdateDiaryInput = z.infer<typeof updateDiarySchema>;
