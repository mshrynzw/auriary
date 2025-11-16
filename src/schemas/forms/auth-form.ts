import { z } from 'zod';

/**
 * ログイン用フォームスキーマ
 */
export const loginFormSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
  password: z.string().min(6, 'パスワードは6文字以上である必要があります'),
});

/**
 * 登録用フォームスキーマ
 */
export const registerFormSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
  password: z.string().min(6, 'パスワードは6文字以上である必要があります'),
  display_name: z
    .string()
    .min(1, '表示名を入力してください')
    .max(50, '表示名は50文字以下である必要があります'),
});

export type LoginFormInput = z.infer<typeof loginFormSchema>;
export type RegisterFormInput = z.infer<typeof registerFormSchema>;
