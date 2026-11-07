/**
 * 収支の用途マスタ。呼び出し側がセッションの user_id を渡す。
 */

import type { SessionDatabase } from '@/lib/auth/session';
import {
  parseBankPurposeInput,
  type BankPurpose,
} from '@/schemas/tables/m_bank_purposes';
import { execute, isRecord, queryAll, queryFirst, readId, readRows } from './sql';

export type BankPurposeFailure = {
  ok: false;
  code: 'VALIDATION_ERROR' | 'DUPLICATE_ERROR' | 'NOT_FOUND';
  message: string;
};

export type BankPurposeWriteResult = { ok: true; purpose: BankPurpose } | BankPurposeFailure;

function isPurposeNameConflict(error: unknown): boolean {
  const message = error instanceof Error ? error.message : '';
  return message.includes('UNIQUE') && message.includes('m_bank_purposes');
}

function readPurpose(row: Record<string, unknown>): BankPurpose | null {
  const id = readId(row.id);
  if (id === null || typeof row.name !== 'string' || typeof row.text_color !== 'string') {
    return null;
  }
  const parsed = parseBankPurposeInput({ name: row.name, textColor: row.text_color });
  if (!parsed.ok) return null;
  return { id, name: parsed.name, text_color: parsed.textColor };
}

export async function listBankPurposes(
  db: SessionDatabase,
  userId: number,
): Promise<BankPurpose[]> {
  const rows = readRows(
    await queryAll(
      db,
      'SELECT id, name, text_color FROM m_bank_purposes WHERE user_id = ? AND deleted_at IS NULL ORDER BY id ASC',
      [userId],
    ),
  );
  return rows.flatMap((row) => {
    const purpose = readPurpose(row);
    return purpose ? [purpose] : [];
  });
}

export async function createBankPurpose(
  db: SessionDatabase,
  userId: number,
  input: { name: string; textColor: string },
  now: Date = new Date(),
): Promise<BankPurposeWriteResult> {
  const parsed = parseBankPurposeInput(input);
  if (!parsed.ok) {
    return { ok: false, code: 'VALIDATION_ERROR', message: parsed.message };
  }

  const timestamp = now.toISOString();
  try {
    await execute(
      db,
      `INSERT INTO m_bank_purposes
        (user_id, name, text_color, created_at, updated_at, created_by, updated_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, parsed.name, parsed.textColor, timestamp, timestamp, userId, userId],
    );
  } catch (error) {
    if (isPurposeNameConflict(error)) {
      return { ok: false, code: 'DUPLICATE_ERROR', message: '同じ用途名が既にあります' };
    }
    throw error;
  }

  const created = await queryFirst(
    db,
    'SELECT id, name, text_color FROM m_bank_purposes WHERE user_id = ? AND name = ? AND deleted_at IS NULL',
    [userId, parsed.name],
  );
  if (!isRecord(created)) {
    throw new Error('用途の追加結果を読めませんでした');
  }
  const purpose = readPurpose(created);
  if (!purpose) {
    throw new Error('用途の追加結果を読めませんでした');
  }
  return { ok: true, purpose };
}

export async function updateBankPurpose(
  db: SessionDatabase,
  userId: number,
  purposeId: number,
  input: { name: string; textColor: string },
  now: Date = new Date(),
): Promise<BankPurposeWriteResult> {
  const parsed = parseBankPurposeInput(input);
  if (!parsed.ok) {
    return { ok: false, code: 'VALIDATION_ERROR', message: parsed.message };
  }

  const existing = await queryFirst(
    db,
    'SELECT id FROM m_bank_purposes WHERE id = ? AND user_id = ? AND deleted_at IS NULL',
    [purposeId, userId],
  );
  if (!isRecord(existing)) {
    return { ok: false, code: 'NOT_FOUND', message: '用途が見つかりません' };
  }

  const timestamp = now.toISOString();
  try {
    await execute(
      db,
      `UPDATE m_bank_purposes
       SET name = ?, text_color = ?, updated_at = ?, updated_by = ?
       WHERE id = ? AND user_id = ? AND deleted_at IS NULL`,
      [parsed.name, parsed.textColor, timestamp, userId, purposeId, userId],
    );
  } catch (error) {
    if (isPurposeNameConflict(error)) {
      return { ok: false, code: 'DUPLICATE_ERROR', message: '同じ用途名が既にあります' };
    }
    throw error;
  }

  return {
    ok: true,
    purpose: { id: purposeId, name: parsed.name, text_color: parsed.textColor },
  };
}

export async function deleteBankPurpose(
  db: SessionDatabase,
  userId: number,
  purposeId: number,
  now: Date = new Date(),
): Promise<{ ok: true } | BankPurposeFailure> {
  const existing = await queryFirst(
    db,
    'SELECT id FROM m_bank_purposes WHERE id = ? AND user_id = ? AND deleted_at IS NULL',
    [purposeId, userId],
  );
  if (!isRecord(existing)) {
    return { ok: false, code: 'NOT_FOUND', message: '用途が見つかりません' };
  }

  const timestamp = now.toISOString();
  await execute(
    db,
    `UPDATE t_bank_transactions
     SET purpose_id = NULL, updated_at = ?, updated_by = ?
     WHERE user_id = ? AND purpose_id = ? AND deleted_at IS NULL`,
    [timestamp, userId, userId, purposeId],
  );
  await execute(
    db,
    `UPDATE m_bank_purposes
     SET deleted_at = ?, deleted_by = ?, updated_at = ?, updated_by = ?
     WHERE id = ? AND user_id = ? AND deleted_at IS NULL`,
    [timestamp, userId, timestamp, userId, purposeId, userId],
  );
  return { ok: true };
}

export async function setBankTransactionPurpose(
  db: SessionDatabase,
  userId: number,
  transactionId: number,
  purposeId: number | null,
  now: Date = new Date(),
): Promise<{ ok: true; purposeId: number | null } | BankPurposeFailure> {
  const transaction = await queryFirst(
    db,
    'SELECT id FROM t_bank_transactions WHERE id = ? AND user_id = ? AND deleted_at IS NULL',
    [transactionId, userId],
  );
  if (!isRecord(transaction)) {
    return { ok: false, code: 'NOT_FOUND', message: '明細が見つかりません' };
  }

  if (purposeId !== null) {
    const purpose = await queryFirst(
      db,
      'SELECT id FROM m_bank_purposes WHERE id = ? AND user_id = ? AND deleted_at IS NULL',
      [purposeId, userId],
    );
    if (!isRecord(purpose)) {
      return { ok: false, code: 'NOT_FOUND', message: '用途が見つかりません' };
    }
  }

  await execute(
    db,
    `UPDATE t_bank_transactions
     SET purpose_id = ?, updated_at = ?, updated_by = ?
     WHERE id = ? AND user_id = ? AND deleted_at IS NULL`,
    [purposeId, now.toISOString(), userId, transactionId, userId],
  );
  return { ok: true, purposeId };
}
