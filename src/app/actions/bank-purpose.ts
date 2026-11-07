'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth';
import {
  createBankPurpose,
  deleteBankPurpose,
  listBankPurposes,
  updateBankPurpose,
} from '@/lib/bank-purpose';
import { getDatabase } from '@/lib/db';
import type { BankPurpose } from '@/schemas/tables/m_bank_purposes';

const purposeIdSchema = z.object({
  id: z.number().int().positive(),
});

const purposeInputSchema = z.object({
  name: z.string(),
  textColor: z.string(),
});

type ActionError = {
  error: {
    code: string;
    message: string;
  };
};

function failure(code: string, message: string): ActionError {
  return { error: { code, message } };
}

export async function getBankPurposesAction(): Promise<{ purposes: BankPurpose[] } | ActionError> {
  const { user } = await requireAuth();
  try {
    const db = await getDatabase();
    return { purposes: await listBankPurposes(db, user.id) };
  } catch (error) {
    console.error('用途の取得に失敗しました', error instanceof Error ? error.message : 'unknown');
    return failure('INTERNAL_ERROR', '用途の取得に失敗しました');
  }
}

export async function createBankPurposeAction(input: {
  name: string;
  textColor: string;
}): Promise<{ purpose: BankPurpose } | ActionError> {
  const { user } = await requireAuth();
  const validated = purposeInputSchema.safeParse(input);
  if (!validated.success) {
    return failure('VALIDATION_ERROR', '用途の形式が正しくありません');
  }

  try {
    const db = await getDatabase();
    const result = await createBankPurpose(db, user.id, validated.data);
    if (!result.ok) return failure(result.code, result.message);
    revalidatePath('/settings');
    revalidatePath('/income-expense');
    return { purpose: result.purpose };
  } catch (error) {
    console.error('用途の追加に失敗しました', error instanceof Error ? error.message : 'unknown');
    return failure('INTERNAL_ERROR', '用途の追加に失敗しました');
  }
}

export async function updateBankPurposeAction(input: {
  id: number;
  name: string;
  textColor: string;
}): Promise<{ purpose: BankPurpose } | ActionError> {
  const { user } = await requireAuth();
  const validated = purposeIdSchema.safeParse({ id: input.id });
  const fields = purposeInputSchema.safeParse({ name: input.name, textColor: input.textColor });
  if (!validated.success || !fields.success) {
    return failure('VALIDATION_ERROR', '用途の形式が正しくありません');
  }

  try {
    const db = await getDatabase();
    const result = await updateBankPurpose(db, user.id, validated.data.id, fields.data);
    if (!result.ok) return failure(result.code, result.message);
    revalidatePath('/settings');
    revalidatePath('/income-expense');
    return { purpose: result.purpose };
  } catch (error) {
    console.error('用途の保存に失敗しました', error instanceof Error ? error.message : 'unknown');
    return failure('INTERNAL_ERROR', '用途の保存に失敗しました');
  }
}

export async function deleteBankPurposeAction(input: {
  id: number;
}): Promise<{ success: true } | ActionError> {
  const { user } = await requireAuth();
  const validated = purposeIdSchema.safeParse(input);
  if (!validated.success) {
    return failure('VALIDATION_ERROR', '用途の形式が正しくありません');
  }

  try {
    const db = await getDatabase();
    const result = await deleteBankPurpose(db, user.id, validated.data.id);
    if (!result.ok) return failure(result.code, result.message);
    revalidatePath('/settings');
    revalidatePath('/income-expense');
    return { success: true };
  } catch (error) {
    console.error('用途の削除に失敗しました', error instanceof Error ? error.message : 'unknown');
    return failure('INTERNAL_ERROR', '用途の削除に失敗しました');
  }
}
