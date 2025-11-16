import { z } from 'zod';
import { commonColumnsSchema } from '../base';

/**
 * m_users（ユーザーマスタ）のデータベース行スキーマ
 * Supabaseから取得した生データ用
 */
export const userRowSchema = commonColumnsSchema.extend({
  auth_user_id: z.string().uuid(),
  display_name: z.string(),
  family_name: z.string().nullable(),
  first_name: z.string().nullable(),
  family_name_kana: z.string().nullable(),
  first_name_kana: z.string().nullable(),
  email: z.string().email().nullable(),
  is_active: z.boolean(),
});

/**
 * m_users（ユーザーマスタ）のアプリケーション用スキーマ
 * Dateオブジェクトに変換など、必要に応じて変換
 */
export const userSchema = userRowSchema;

export type User = z.infer<typeof userSchema>;
export type UserRow = z.infer<typeof userRowSchema>;

