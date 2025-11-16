import { z } from 'zod';
import { commonColumnsSchema, userIdSchema } from '../base';

/**
 * r_user_ext_accounts（外部アカウント連携）のデータベース行スキーマ
 */
export const userExtAccountRowSchema = commonColumnsSchema.extend({
  user_id: userIdSchema,
  provider: z.string(),
  ext_user_id: z.string(),
  access_token_encrypted: z.string().nullable(),
  refresh_token_encrypted: z.string().nullable(),
  token_expires_at: z.string().datetime().nullable(),
});

/**
 * r_user_ext_accounts（外部アカウント連携）のアプリケーション用スキーマ
 */
export const userExtAccountSchema = userExtAccountRowSchema.transform((data) => ({
  ...data,
  token_expires_at: data.token_expires_at ? new Date(data.token_expires_at) : null,
}));

export type UserExtAccount = z.infer<typeof userExtAccountSchema>;
export type UserExtAccountRow = z.infer<typeof userExtAccountRowSchema>;
