import { z } from 'zod';

/**
 * 共通カラムのスキーマ
 * すべてのテーブルに共通するカラムを定義
 */
export const commonColumnsSchema = z.object({
  id: z.number().int().positive(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  deleted_at: z.string().datetime().nullable(),
  created_by: z.string().uuid(),
  updated_by: z.string().uuid(),
  deleted_by: z.string().uuid().nullable(),
  source_id: z.number().int().positive().nullable(),
});

/**
 * 型の区別（Brand型）
 * 異なるID型を区別するために使用
 */
export const userIdSchema = z.number().int().positive().brand<'UserId'>();
export const diaryIdSchema = z.number().int().positive().brand<'DiaryId'>();
export const medicationIdSchema = z.number().int().positive().brand<'MedicationId'>();
export const userMedicationIdSchema = z.number().int().positive().brand<'UserMedicationId'>();

/**
 * レベル値の共通スキーマ（1-5の範囲）
 */
export const levelSchema = z.number().int().min(1).max(5);

/**
 * レベル値の共通スキーマ（1-10の範囲）
 */
export const moodSchema = z.number().int().min(1).max(10);

/**
 * 日付文字列スキーマ（ISO8601 date string）
 */
export const dateStringSchema = z.string().date();

/**
 * 日時文字列スキーマ（ISO8601 datetime string）
 */
export const datetimeStringSchema = z.string().datetime();

/**
 * 時刻文字列スキーマ（HH:mm形式）
 * 空文字列をnullに変換し、HH:mm形式を検証
 */
export const timeStringSchema = z
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

