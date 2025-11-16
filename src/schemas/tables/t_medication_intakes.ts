import { z } from 'zod';
import { commonColumnsSchema, userIdSchema, userMedicationIdSchema, levelSchema } from '../base';

/**
 * t_medication_intakes（服薬実績）のデータベース行スキーマ
 */
export const medicationIntakeRowSchema = commonColumnsSchema.extend({
  user_id: userIdSchema,
  user_medication_id: userMedicationIdSchema,
  intake_date: z.string().date(),
  adherence_score: levelSchema.nullable(),
  note: z.string().nullable(),
});

/**
 * t_medication_intakes（服薬実績）のアプリケーション用スキーマ
 */
export const medicationIntakeSchema = medicationIntakeRowSchema.transform((data) => ({
  ...data,
  intake_date: new Date(data.intake_date),
}));

export type MedicationIntake = z.infer<typeof medicationIntakeSchema>;
export type MedicationIntakeRow = z.infer<typeof medicationIntakeRowSchema>;
