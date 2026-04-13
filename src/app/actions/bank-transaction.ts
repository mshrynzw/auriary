'use server';

import { requireAuth, getAuth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { type BankTransactionRow } from '@/schemas';

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

  const insertRows = records.map((record) => ({
    user_id: userProfile.id,
    txn_date: record.txn_date,
    txn_type: record.txn_type,
    amount: record.amount,
    description: record.description ?? null,
    source_file_name: validated.data.source_file_name ?? null,
    created_by: user.id,
    updated_by: user.id,
  }));

  const { error: insertError } = await supabase.from('t_bank_transactions').insert(insertRows);
  if (insertError) {
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
  };
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
