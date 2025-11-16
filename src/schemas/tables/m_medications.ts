import { z } from 'zod';
import { commonColumnsSchema } from '../base';

/**
 * m_medications（薬マスタ）のデータベース行スキーマ
 */
export const medicationRowSchema = commonColumnsSchema.extend({
  name: z.string(),
  generic_name: z.string().nullable(),
  memo: z.string().nullable(),
});

/**
 * m_medications（薬マスタ）のアプリケーション用スキーマ
 */
export const medicationSchema = medicationRowSchema;

export type Medication = z.infer<typeof medicationSchema>;
export type MedicationRow = z.infer<typeof medicationRowSchema>;

