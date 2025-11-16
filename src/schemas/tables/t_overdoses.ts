import { z } from 'zod';
import { commonColumnsSchema, userIdSchema, medicationIdSchema } from '../base';

/**
 * t_overdoses（OD記録）のデータベース行スキーマ
 */
export const overdoseRowSchema = commonColumnsSchema.extend({
  user_id: userIdSchema,
  occurred_at: z.string().datetime(),
  medication_id: medicationIdSchema.nullable(),
  medication_name: z.string().nullable(),
  amount: z.number().nullable(),
  amount_unit: z.string().nullable(),
  note: z.string().nullable(),
});

/**
 * t_overdoses（OD記録）のアプリケーション用スキーマ
 */
export const overdoseSchema = overdoseRowSchema.transform((data) => ({
  ...data,
  occurred_at: new Date(data.occurred_at),
}));

export type Overdose = z.infer<typeof overdoseSchema>;
export type OverdoseRow = z.infer<typeof overdoseRowSchema>;

