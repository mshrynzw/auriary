import { z } from 'zod';

export const bankPurposeNameMaxLength = 30;
export const defaultBankPurposeTextColor = '#808080';
export const unsetBankPurposeValue = 'unset';

const hexColorPattern = /^#[0-9a-f]{6}$/;

export const bankPurposeNameSchema = z
  .string()
  .trim()
  .min(1, '用途名を入力してください')
  .max(
    bankPurposeNameMaxLength,
    `用途名は${bankPurposeNameMaxLength}文字以内で入力してください`,
  );

export const bankPurposeTextColorSchema = z
  .string()
  .trim()
  .transform((value) => (value.length === 0 ? defaultBankPurposeTextColor : value.toLowerCase()))
  .refine((value) => hexColorPattern.test(value), '文字色は #RRGGBB で指定してください');

export type BankPurpose = {
  id: number;
  name: string;
  text_color: string;
};

export function parseBankPurposeInput(input: {
  name: string;
  textColor: string;
}): { ok: true; name: string; textColor: string } | { ok: false; message: string } {
  const name = bankPurposeNameSchema.safeParse(input.name);
  if (!name.success) {
    return {
      ok: false,
      message: name.error.issues[0]?.message ?? '用途名の形式が正しくありません',
    };
  }
  const textColor = bankPurposeTextColorSchema.safeParse(input.textColor);
  if (!textColor.success) {
    return {
      ok: false,
      message: textColor.error.issues[0]?.message ?? '文字色の形式が正しくありません',
    };
  }
  return { ok: true, name: name.data, textColor: textColor.data };
}

/** 画面の style に渡してよい色。壊れた値は黒に戻す。 */
export function bankPurposeTextColor(color: string): string {
  const canonical = color.trim().toLowerCase();
  return hexColorPattern.test(canonical) ? canonical : defaultBankPurposeTextColor;
}
