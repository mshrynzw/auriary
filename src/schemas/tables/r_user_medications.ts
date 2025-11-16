import { z } from 'zod';
import { commonColumnsSchema, userIdSchema, medicationIdSchema } from '../base';

/**
 * r_user_medications（ユーザー別処方）のデータベース行スキーマ
 */
export const userMedicationRowSchema = commonColumnsSchema.extend({
  user_id: userIdSchema,
  medication_id: medicationIdSchema,
  dosage_text: z.string().nullable(),
  dose_amount: z.number().nullable(),
  dose_unit: z.string().nullable(),
  start_date: z.string().date(),
  end_date: z.string().date().nullable(),
  is_current: z.boolean(),
});

/**
 * r_user_medications（ユーザー別処方）のアプリケーション用スキーマ
 */
export const userMedicationSchema = userMedicationRowSchema.transform((data) => ({
  ...data,
  start_date: new Date(data.start_date),
  end_date: data.end_date ? new Date(data.end_date) : null,
}));

export type UserMedication = z.infer<typeof userMedicationSchema>;
export type UserMedicationRow = z.infer<typeof userMedicationRowSchema>;
