/**
 * @vitest-environment node
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { registerAccount } from '@/lib/auth/accounts';
import type { SessionDatabase, SessionSqlValue, SessionStatement } from '@/lib/auth/session';
import {
  createBankPurpose,
  deleteBankPurpose,
  listBankPurposes,
  setBankTransactionPurpose,
  updateBankPurpose,
} from '@/lib/bank-purpose';

const migrationsDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../migrations');

describe('D1 の収支用途', () => {
  let sqlite: DatabaseSync;

  beforeAll(() => {
    sqlite = new DatabaseSync(':memory:');
    sqlite.exec('PRAGMA foreign_keys = ON');
    sqlite.exec(fs.readFileSync(path.join(migrationsDir, '0001_initial_schema.sql'), 'utf8'));
    sqlite.exec(fs.readFileSync(path.join(migrationsDir, '0002_bank_purposes.sql'), 'utf8'));
    sqlite.exec(
      fs.readFileSync(path.join(migrationsDir, '0003_simplify_bank_purpose_color_check.sql'), 'utf8'),
    );
  });

  afterAll(() => {
    sqlite.close();
  });

  it('用途は本人だけが追加・変更・削除でき、削除すると明細は未設定に戻る', async () => {
    const db = asSessionDatabase(sqlite);
    const userA = await register(db, 'purpose-a@example.com');
    const userB = await register(db, 'purpose-b@example.com');

    const food = await createBankPurpose(db, userA, { name: ' 食費 ', textColor: '#DC2626' });
    expect(food.ok).toBe(true);
    if (!food.ok) return;
    expect(food.purpose).toMatchObject({ name: '食費', text_color: '#dc2626' });

    const duplicate = await createBankPurpose(db, userA, { name: '食費', textColor: '#000000' });
    expect(duplicate).toMatchObject({ ok: false, code: 'DUPLICATE_ERROR' });

    const invalid = await createBankPurpose(db, userA, { name: '交通費', textColor: 'red' });
    expect(invalid).toMatchObject({ ok: false, code: 'VALIDATION_ERROR' });

    const otherFood = await createBankPurpose(db, userB, { name: '食費', textColor: '#2563eb' });
    expect(otherFood.ok).toBe(true);
    if (!otherFood.ok) return;

    expect(await listBankPurposes(db, userA)).toEqual([food.purpose]);
    expect(await listBankPurposes(db, userB)).toEqual([otherFood.purpose]);

    const renamed = await updateBankPurpose(db, userA, food.purpose.id, {
      name: '昼食',
      textColor: '#16A34A',
    });
    expect(renamed).toMatchObject({
      ok: true,
      purpose: { id: food.purpose.id, name: '昼食', text_color: '#16a34a' },
    });

    const transactionA = insertTransaction(sqlite, userA);
    const transactionB = insertTransaction(sqlite, userB);

    const assigned = await setBankTransactionPurpose(db, userA, transactionA, food.purpose.id);
    expect(assigned).toEqual({ ok: true, purposeId: food.purpose.id });
    expect(purposeIdOf(sqlite, transactionA)).toBe(food.purpose.id);

    const stolen = await setBankTransactionPurpose(db, userA, transactionA, otherFood.purpose.id);
    expect(stolen).toMatchObject({ ok: false, code: 'NOT_FOUND' });
    expect(purposeIdOf(sqlite, transactionA)).toBe(food.purpose.id);

    const otherRow = await setBankTransactionPurpose(db, userA, transactionB, food.purpose.id);
    expect(otherRow).toMatchObject({ ok: false, code: 'NOT_FOUND' });
    expect(purposeIdOf(sqlite, transactionB)).toBeNull();

    const removed = await deleteBankPurpose(db, userA, food.purpose.id);
    expect(removed).toEqual({ ok: true });
    expect(await listBankPurposes(db, userA)).toEqual([]);
    expect(purposeIdOf(sqlite, transactionA)).toBeNull();
    expect(await listBankPurposes(db, userB)).toEqual([otherFood.purpose]);

    const restored = await createBankPurpose(db, userA, { name: '昼食', textColor: '#16a34a' });
    expect(restored.ok).toBe(true);
  });
});

async function register(db: SessionDatabase, email: string): Promise<number> {
  const registered = await registerAccount(db, {
    email,
    password: 'testpassword123',
    displayName: '用途テスト',
  });
  if (!registered.ok) {
    throw new Error(registered.message);
  }
  return registered.user.id;
}

function insertTransaction(sqlite: DatabaseSync, userId: number): number {
  sqlite
    .prepare(
      `INSERT INTO t_bank_transactions
        (user_id, txn_date, txn_type, amount, description, created_by, updated_by)
       VALUES (?, '2026-11-06', '支払', 278, 'SEVEN-ELEVEN', ?, ?)`,
    )
    .run(userId, userId, userId);
  const row = sqlite.prepare('SELECT id FROM t_bank_transactions WHERE user_id = ?').get(userId);
  if (!isRecord(row) || typeof row.id !== 'number') {
    throw new Error('明細を読めませんでした');
  }
  return row.id;
}

function purposeIdOf(sqlite: DatabaseSync, transactionId: number): number | null {
  const row = sqlite
    .prepare('SELECT purpose_id FROM t_bank_transactions WHERE id = ?')
    .get(transactionId);
  if (!isRecord(row) || row.purpose_id === null || row.purpose_id === undefined) return null;
  if (typeof row.purpose_id !== 'number') {
    throw new Error('purpose_id の形が不正です');
  }
  return row.purpose_id;
}

function asSessionDatabase(sqlite: DatabaseSync): SessionDatabase {
  return {
    prepare(query: string): SessionStatement {
      const statement = sqlite.prepare(query);
      let values: SessionSqlValue[] = [];
      const api: SessionStatement = {
        bind(...bound) {
          values = [...bound];
          return api;
        },
        async run() {
          statement.run(...values);
          return { success: true };
        },
        async first() {
          return statement.get(...values) ?? null;
        },
        async all() {
          const rows = statement.all(...values);
          return Array.isArray(rows) ? rows : [];
        },
      };
      return api;
    },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
