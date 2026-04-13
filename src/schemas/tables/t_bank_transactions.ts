import { z } from 'zod';
import { commonColumnsSchema, userIdSchema } from '../base';

export const bankTransactionTypeSchema = z.enum(['支払', '入金']);

/**
 * t_bank_transactions（銀行取引明細）のデータベース行スキーマ
 */
export const bankTransactionRowSchema = commonColumnsSchema.extend({
  user_id: userIdSchema,
  txn_date: z.string().date(),
  txn_type: bankTransactionTypeSchema,
  amount: z.number().int().nonnegative(),
  description: z.string().nullable(),
  source_file_name: z.string().nullable(),
});

/**
 * t_bank_transactions（銀行取引明細）のアプリケーション用スキーマ
 */
export const bankTransactionSchema = bankTransactionRowSchema.transform((data) => ({
  ...data,
  txn_date: new Date(data.txn_date),
}));

export type BankTransaction = z.infer<typeof bankTransactionSchema>;
export type BankTransactionRow = z.infer<typeof bankTransactionRowSchema>;
