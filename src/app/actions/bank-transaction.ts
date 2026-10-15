'use server';

import { requireAuth, getAuth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { bankTransactionMemoMaxLength, type BankTransactionRow } from '@/schemas';

const importRecordSchema = z.object({
  txn_date: z.string().date(),
  txn_type: z.enum(['支払', '入金']),
  amount: z.number().int().nonnegative(),
  description: z.string().nullable().optional(),
});

const importPayloadSchema = z.object({
  source_file_name: z.string().min(1).max(255).optional(),
  records: z.array(importRecordSchema).min(1),
});

type ImportPayload = z.infer<typeof importPayloadSchema>;

const updateMemoSchema = z.object({
  id: z.number().int().positive(),
  memo: z.string().max(bankTransactionMemoMaxLength).nullable(),
});

type MemoSourceRow = {
  id: number;
  txn_date: string;
  txn_type: string;
  amount: number;
  description: string | null;
  memo: string | null;
};

function memoMatchKey(row: {
  txn_date: string;
  txn_type: string;
  amount: number;
  description?: string | null;
}) {
  return JSON.stringify([row.txn_date, row.txn_type, row.amount, row.description ?? null]);
}

/** 再取り込みで行が作り直されても、同じ明細のメモを並び順どおり残す */
function assignPreservedMemos(
  existing: MemoSourceRow[],
  records: Array<{
    txn_date: string;
    txn_type: string;
    amount: number;
    description?: string | null;
  }>,
): Array<string | null> {
  const queues = new Map<string, Array<string | null>>();
  const sorted = [...existing].sort((a, b) => a.id - b.id);
  for (const row of sorted) {
    const key = memoMatchKey(row);
    const queue = queues.get(key);
    const memo = row.memo ?? null;
    if (queue) queue.push(memo);
    else queues.set(key, [memo]);
  }

  return records.map((record) => {
    const queue = queues.get(memoMatchKey(record));
    if (!queue || queue.length === 0) return null;
    return queue.shift() ?? null;
  });
}

function normalizeMemo(memo: string | null) {
  const trimmed = memo?.trim() ?? '';
  if (trimmed.length > bankTransactionMemoMaxLength) {
    return {
      error: `メモは${bankTransactionMemoMaxLength}文字以内で入力してください`,
    };
  }
  return { memo: trimmed.length === 0 ? null : trimmed };
}

export async function replaceBankTransactionsAction(payload: ImportPayload) {
  const { user, userProfile, supabase } = await requireAuth();

  const validated = importPayloadSchema.safeParse(payload);
  if (!validated.success) {
    return {
      error: {
        code: 'VALIDATION_ERROR',
        message: validated.error.issues[0]?.message ?? 'CSVデータの形式が正しくありません',
      },
    };
  }

  const records = validated.data.records;
  const dates = records.map((r) => r.txn_date).sort();
  const startDate = dates[0];
  const endDate = dates[dates.length - 1];

  const { data: existingRows, error: existingError } = await supabase
    .from('t_bank_transactions')
    .select('id, txn_date, txn_type, amount, description, memo')
    .eq('user_id', userProfile.id)
    .gte('txn_date', startDate)
    .lte('txn_date', endDate)
    .is('deleted_at', null);

  if (existingError) {
    return {
      error: {
        code: 'INTERNAL_ERROR',
        message: '既存明細の取得に失敗しました',
      },
    };
  }

  const preservedMemos = assignPreservedMemos((existingRows ?? []) as MemoSourceRow[], records);

  // 同じ期間の既存データを削除してから再挿入（再アップロード時の上書き）
  const { error: deleteError } = await supabase
    .from('t_bank_transactions')
    .delete()
    .eq('user_id', userProfile.id)
    .gte('txn_date', startDate)
    .lte('txn_date', endDate);

  if (deleteError) {
    return {
      error: {
        code: 'INTERNAL_ERROR',
        message: '既存明細の削除に失敗しました',
      },
    };
  }

  const insertRows = records.map((record, index) => ({
    user_id: userProfile.id,
    txn_date: record.txn_date,
    txn_type: record.txn_type,
    amount: record.amount,
    description: record.description ?? null,
    memo: preservedMemos[index] ?? null,
    source_file_name: validated.data.source_file_name ?? null,
    created_by: user.id,
    updated_by: user.id,
  }));

  const { data: inserted, error: insertError } = await supabase
    .from('t_bank_transactions')
    .insert(insertRows)
    .select('*');
  if (insertError || !inserted) {
    return {
      error: {
        code: 'INTERNAL_ERROR',
        message: '明細の保存に失敗しました',
      },
    };
  }

  revalidatePath('/income-expense');
  return {
    success: true,
    importedCount: records.length,
    startDate,
    endDate,
    transactions: inserted as BankTransactionRow[],
  };
}

export async function updateBankTransactionMemoAction(input: { id: number; memo: string | null }) {
  const { user, userProfile, supabase } = await requireAuth();

  const validated = updateMemoSchema.safeParse(input);
  if (!validated.success) {
    return {
      error: {
        code: 'VALIDATION_ERROR',
        message: validated.error.issues[0]?.message ?? 'メモの形式が正しくありません',
      },
    };
  }

  const normalized = normalizeMemo(validated.data.memo);
  if ('error' in normalized) {
    return {
      error: {
        code: 'VALIDATION_ERROR',
        message: normalized.error,
      },
    };
  }

  const { data, error } = await supabase
    .from('t_bank_transactions')
    .update({
      memo: normalized.memo,
      updated_by: user.id,
    })
    .eq('id', validated.data.id)
    .eq('user_id', userProfile.id)
    .is('deleted_at', null)
    .select('memo')
    .maybeSingle();

  if (error) {
    return {
      error: {
        code: 'INTERNAL_ERROR',
        message: 'メモの保存に失敗しました',
      },
    };
  }

  if (!data) {
    return {
      error: {
        code: 'NOT_FOUND',
        message: '明細が見つかりません',
      },
    };
  }

  return { memo: (data.memo ?? null) as string | null };
}

export async function getBankTransactionsAction(params?: {
  start_date?: string;
  end_date?: string;
  limit?: number;
  offset?: number;
}) {
  const { userProfile, supabase } = await getAuth();
  if (!userProfile || !supabase) {
    return { transactions: [] as BankTransactionRow[] };
  }

  let query = supabase
    .from('t_bank_transactions')
    .select('*')
    .eq('user_id', userProfile.id)
    .is('deleted_at', null)
    .order('txn_date', { ascending: false })
    .order('id', { ascending: false });

  if (params?.start_date) query = query.gte('txn_date', params.start_date);
  if (params?.end_date) query = query.lte('txn_date', params.end_date);
  if (params?.limit) query = query.limit(params.limit);
  if (params?.offset) query = query.range(params.offset, params.offset + (params.limit || 20) - 1);

  const { data, error } = await query;
  if (error) {
    return {
      error: {
        code: 'INTERNAL_ERROR',
        message: '収支明細の取得に失敗しました',
      },
    };
  }

  return { transactions: (data || []) as BankTransactionRow[] };
}
