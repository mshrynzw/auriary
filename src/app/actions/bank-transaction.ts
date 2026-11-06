'use server';

import { requireAuth, getAuth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { bankTransactionMemoMaxLength, type BankTransactionRow } from '@/schemas';
import { getDatabase } from '@/lib/db';
import { execute, isRecord, queryAll, queryFirst, readId, readRows } from '@/lib/sql';

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
  const { user } = await requireAuth();

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
  if (!startDate || !endDate) {
    return {
      error: {
        code: 'VALIDATION_ERROR',
        message: 'CSVデータの形式が正しくありません',
      },
    };
  }

  try {
    const db = await getDatabase();
    const existingRows = readRows(
      await queryAll(
        db,
        'SELECT id, txn_date, txn_type, amount, description, memo FROM t_bank_transactions WHERE user_id = ? AND txn_date >= ? AND txn_date <= ? AND deleted_at IS NULL ORDER BY id ASC',
        [user.id, startDate, endDate],
      ),
    ).flatMap((row) => {
      const id = readId(row.id);
      if (id === null || typeof row.txn_date !== 'string' || typeof row.txn_type !== 'string') {
        return [];
      }
      const amount = typeof row.amount === 'number' ? row.amount : Number(row.amount);
      return [
        {
          id,
          txn_date: row.txn_date,
          txn_type: row.txn_type,
          amount,
          description: typeof row.description === 'string' ? row.description : null,
          memo: typeof row.memo === 'string' ? row.memo : null,
        } satisfies MemoSourceRow,
      ];
    });
    const preservedMemos = assignPreservedMemos(existingRows, records);
    const now = new Date().toISOString();

    await execute(
      db,
      'DELETE FROM t_bank_transactions WHERE user_id = ? AND txn_date >= ? AND txn_date <= ?',
      [user.id, startDate, endDate],
    );

    for (const [index, record] of records.entries()) {
      await execute(
        db,
        'INSERT INTO t_bank_transactions (user_id, txn_date, txn_type, amount, description, memo, source_file_name, created_at, updated_at, created_by, updated_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          user.id,
          record.txn_date,
          record.txn_type,
          record.amount,
          record.description ?? null,
          preservedMemos[index] ?? null,
          validated.data.source_file_name ?? null,
          now,
          now,
          user.id,
          user.id,
        ],
      );
    }

    const inserted = await listBankTransactions(db, user.id, {
      start_date: startDate,
      end_date: endDate,
    });
    revalidatePath('/income-expense');
    return {
      success: true,
      importedCount: records.length,
      startDate,
      endDate,
      transactions: inserted,
    };
  } catch (error) {
    console.error('明細の保存に失敗しました', error instanceof Error ? error.message : 'unknown');
    return {
      error: {
        code: 'INTERNAL_ERROR',
        message: '明細の保存に失敗しました',
      },
    };
  }
}

export async function updateBankTransactionMemoAction(input: { id: number; memo: string | null }) {
  const { user } = await requireAuth();

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

  try {
    const db = await getDatabase();
    const existing = await queryFirst(
      db,
      'SELECT id FROM t_bank_transactions WHERE id = ? AND user_id = ? AND deleted_at IS NULL',
      [validated.data.id, user.id],
    );
    if (!isRecord(existing)) {
      return {
        error: {
          code: 'NOT_FOUND',
          message: '明細が見つかりません',
        },
      };
    }
    await execute(
      db,
      'UPDATE t_bank_transactions SET memo = ?, updated_at = ?, updated_by = ? WHERE id = ? AND user_id = ? AND deleted_at IS NULL',
      [normalized.memo, new Date().toISOString(), user.id, validated.data.id, user.id],
    );
    return { memo: normalized.memo };
  } catch (error) {
    console.error('メモの保存に失敗しました', error instanceof Error ? error.message : 'unknown');
    return {
      error: {
        code: 'INTERNAL_ERROR',
        message: 'メモの保存に失敗しました',
      },
    };
  }
}

export async function getBankTransactionsAction(params?: {
  start_date?: string;
  end_date?: string;
  limit?: number;
  offset?: number;
}) {
  const { userProfile } = await getAuth();
  if (!userProfile) {
    return { transactions: [] as BankTransactionRow[] };
  }

  try {
    const db = await getDatabase();
    return { transactions: await listBankTransactions(db, userProfile.id, params) };
  } catch (error) {
    console.error(
      '収支明細の取得に失敗しました',
      error instanceof Error ? error.message : 'unknown',
    );
    return {
      error: {
        code: 'INTERNAL_ERROR',
        message: '収支明細の取得に失敗しました',
      },
    };
  }
}

async function listBankTransactions(
  db: Awaited<ReturnType<typeof getDatabase>>,
  userId: number,
  params?: {
    start_date?: string;
    end_date?: string;
    limit?: number;
    offset?: number;
  },
): Promise<BankTransactionRow[]> {
  const where = ['user_id = ?', 'deleted_at IS NULL'];
  const values: Array<string | number | null> = [userId];
  if (params?.start_date) {
    where.push('txn_date >= ?');
    values.push(params.start_date);
  }
  if (params?.end_date) {
    where.push('txn_date <= ?');
    values.push(params.end_date);
  }
  let sql = `SELECT * FROM t_bank_transactions WHERE ${where.join(' AND ')} ORDER BY txn_date DESC, id DESC`;
  if (params?.limit !== undefined || params?.offset !== undefined) {
    sql += ' LIMIT ? OFFSET ?';
    values.push(params.limit ?? -1, params.offset ?? 0);
  }
  return readRows(await queryAll(db, sql, values)) as BankTransactionRow[];
}
