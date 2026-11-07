/**
 * @vitest-environment node
 */
/// <reference path="./node-sqlite.d.ts" />
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  createSessionCredential,
  saveSession,
  verifySession,
  type SessionDatabase,
  type SessionSqlValue,
  type SessionStatement,
} from '@/lib/auth/session';

import { DatabaseSync } from 'node:sqlite';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const wranglerBin = path.join(repoRoot, 'node_modules', 'wrangler', 'bin', 'wrangler.js');

const EXPECTED_COLUMNS: Record<string, readonly string[]> = {
  m_users: [
    'id',
    'display_name',
    'family_name',
    'first_name',
    'family_name_kana',
    'first_name_kana',
    'email',
    'password_hash',
    'is_active',
    'source_id',
    'created_at',
    'updated_at',
    'deleted_at',
    'created_by',
    'updated_by',
    'deleted_by',
  ],
  m_user_daily_defaults: [
    'id',
    'user_id',
    'sleep_quality_default',
    'wake_level_default',
    'daytime_level_default',
    'pre_sleep_level_default',
    'med_adherence_level_default',
    'appetite_level_default',
    'sleep_desire_level_default',
    'exercise_level_default',
    'bipolar_self_level_default',
    'sleep_start_at_default',
    'sleep_end_at_default',
    'bath_start_at_default',
    'bath_end_at_default',
    'source_id',
    'created_at',
    'updated_at',
    'deleted_at',
    'created_by',
    'updated_by',
    'deleted_by',
  ],
  m_medications: [
    'id',
    'name',
    'generic_name',
    'memo',
    'source_id',
    'created_at',
    'updated_at',
    'deleted_at',
    'created_by',
    'updated_by',
    'deleted_by',
  ],
  r_user_medications: [
    'id',
    'user_id',
    'medication_id',
    'dosage_text',
    'dose_amount',
    'dose_unit',
    'start_date',
    'end_date',
    'is_current',
    'source_id',
    'created_at',
    'updated_at',
    'deleted_at',
    'created_by',
    'updated_by',
    'deleted_by',
  ],
  r_user_ext_accounts: [
    'id',
    'user_id',
    'provider',
    'ext_user_id',
    'access_token_encrypted',
    'refresh_token_encrypted',
    'token_expires_at',
    'source_id',
    'created_at',
    'updated_at',
    'deleted_at',
    'created_by',
    'updated_by',
    'deleted_by',
  ],
  t_diaries: [
    'id',
    'user_id',
    'journal_date',
    'sleep_start_at',
    'sleep_end_at',
    'bath_start_at',
    'bath_end_at',
    'sleep_quality',
    'wake_level',
    'daytime_level',
    'pre_sleep_level',
    'med_adherence_level',
    'appetite_level',
    'sleep_desire_level',
    'exercise_level',
    'bipolar_self_level',
    'note',
    'has_od',
    'od_times',
    'has_alcohol',
    'alcohol_times',
    'ai_summary',
    'ai_topics',
    'mood',
    'sentiment_analysis_result',
    'systolic',
    'diastolic',
    'pulse',
    'source_id',
    'created_at',
    'updated_at',
    'deleted_at',
    'created_by',
    'updated_by',
    'deleted_by',
  ],
  t_diary_attachments: [
    'id',
    'diary_id',
    'file_path',
    'file_type',
    'file_size',
    'thumbnail_path',
    'source_id',
    'created_at',
    'updated_at',
    'deleted_at',
    'created_by',
    'updated_by',
    'deleted_by',
  ],
  t_overdoses: [
    'id',
    'user_id',
    'occurred_at',
    'medication_id',
    'medication_name',
    'amount',
    'amount_unit',
    'note',
    'source_id',
    'created_at',
    'updated_at',
    'deleted_at',
    'created_by',
    'updated_by',
    'deleted_by',
  ],
  r_diary_overdoses: [
    'id',
    'diary_id',
    'overdose_id',
    'source_id',
    'created_at',
    'updated_at',
    'deleted_at',
    'created_by',
    'updated_by',
    'deleted_by',
  ],
  t_medication_intakes: [
    'id',
    'user_id',
    'user_medication_id',
    'intake_date',
    'adherence_score',
    'note',
    'source_id',
    'created_at',
    'updated_at',
    'deleted_at',
    'created_by',
    'updated_by',
    'deleted_by',
  ],
  t_bank_transactions: [
    'id',
    'user_id',
    'txn_date',
    'txn_type',
    'amount',
    'description',
    'memo',
    'source_file_name',
    'source_id',
    'created_at',
    'updated_at',
    'deleted_at',
    'created_by',
    'updated_by',
    'deleted_by',
    'purpose_id',
  ],
  m_bank_purposes: [
    'id',
    'user_id',
    'name',
    'text_color',
    'source_id',
    'created_at',
    'updated_at',
    'deleted_at',
    'created_by',
    'updated_by',
    'deleted_by',
  ],
  t_sessions: ['id', 'user_id', 'token_hash', 'expires_at', 'revoked_at', 'created_at'],
};

describe('ローカル D1 のスキーマとセッション', () => {
  let persistDir = '';
  let sqlite: DatabaseSync | null = null;

  beforeAll(() => {
    persistDir = fs.mkdtempSync(path.join(os.tmpdir(), 'auriary-d1-'));
    applyMigrations(persistDir);
    sqlite = openMigratedDatabase(findSqliteFiles(persistDir));
  }, 180_000);

  afterAll(() => {
    sqlite?.close();
    sqlite = null;
    if (persistDir) {
      fs.rmSync(persistDir, { recursive: true, force: true });
    }
  });

  it('Supabase マイグレーションのテーブルと列を漏らさない', () => {
    const db = database();
    const tables = tableNames(db).filter(
      (name) => !name.startsWith('d1_') && !name.startsWith('sqlite_') && !name.startsWith('_cf_'),
    );
    expect(tables.sort()).toEqual(Object.keys(EXPECTED_COLUMNS).sort());

    for (const [table, columns] of Object.entries(EXPECTED_COLUMNS)) {
      expect(columnNames(db, table)).toEqual(columns);
    }

    const userColumns = columnInfo(db, 'm_users');
    expect(userColumns.find((column) => column.name === 'auth_user_id')).toBeUndefined();
    expect(columnType(userColumns, 'email')).toBe('TEXT');
    expect(columnNotNull(userColumns, 'email')).toBe(1);
    expect(columnType(userColumns, 'password_hash')).toBe('TEXT');
    expect(columnNotNull(userColumns, 'password_hash')).toBe(1);
    expect(columnType(userColumns, 'created_by')).toBe('INTEGER');
    expect(columnNotNull(userColumns, 'created_by')).toBe(0);

    const diaryColumns = columnInfo(db, 't_diaries');
    expect(columnType(diaryColumns, 'created_by')).toBe('INTEGER');
    expect(columnNotNull(diaryColumns, 'created_by')).toBe(1);
    expect(columnType(diaryColumns, 'od_times')).toBe('TEXT');
    expect(columnType(diaryColumns, 'sentiment_analysis_result')).toBe('TEXT');

    const sessionColumns = columnInfo(db, 't_sessions');
    expect(columnType(sessionColumns, 'token_hash')).toBe('TEXT');
    expect(columnNotNull(sessionColumns, 'revoked_at')).toBe(0);
  });

  it('各テーブルへ代表行を入れ、制約が効く', () => {
    const db = database();
    const userId = insertUser(db, 'user@example.com');
    run(db, 'UPDATE m_users SET created_by = id, updated_by = id WHERE id = ?', [userId]);
    const audit = getRow(db, 'SELECT created_by, updated_by FROM m_users WHERE id = ?', [userId]);
    expect(audit?.created_by).toBe(userId);
    expect(audit?.updated_by).toBe(userId);

    run(
      db,
      'INSERT INTO m_user_daily_defaults (user_id, created_by, updated_by) VALUES (?, ?, ?)',
      [userId, userId, userId],
    );
    run(db, 'INSERT INTO m_medications (name, created_by, updated_by) VALUES (?, ?, ?)', [
      'リスペリドン',
      userId,
      userId,
    ]);
    const medicationId = readId(
      getRow(db, 'SELECT id FROM m_medications WHERE name = ?', ['リスペリドン']),
    );
    run(
      db,
      `INSERT INTO r_user_medications
        (user_id, medication_id, dosage_text, dose_amount, dose_unit, start_date, created_by, updated_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, medicationId, '朝1錠', 0.5, '錠', '2026-11-06', userId, userId],
    );
    const userMedicationId = readId(
      getRow(db, 'SELECT id FROM r_user_medications WHERE user_id = ?', [userId]),
    );
    run(
      db,
      `INSERT INTO r_user_ext_accounts
        (user_id, provider, ext_user_id, created_by, updated_by)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, 'google', 'ext-1', userId, userId],
    );
    run(
      db,
      `INSERT INTO t_diaries (
        user_id, journal_date, bipolar_self_level, systolic, diastolic, pulse,
        od_times, alcohol_times, has_alcohol, sentiment_analysis_result, created_by, updated_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        '2026-11-06',
        5,
        120,
        80,
        70,
        '[]',
        '[{"occurred_at":"2026-11-06T12:00:00.000Z"}]',
        0,
        '{"sentiment":"neutral"}',
        userId,
        userId,
      ],
    );
    const diaryId = readId(getRow(db, 'SELECT id FROM t_diaries WHERE user_id = ?', [userId]));
    run(
      db,
      `INSERT INTO t_diary_attachments
        (diary_id, file_path, file_type, created_by, updated_by)
       VALUES (?, ?, ?, ?, ?)`,
      [diaryId, 'files/a.png', 'image/png', userId, userId],
    );
    run(
      db,
      `INSERT INTO t_overdoses
        (user_id, occurred_at, medication_id, amount, created_by, updated_by)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, '2026-11-06T01:00:00.000Z', medicationId, 2.5, userId, userId],
    );
    const overdoseId = readId(getRow(db, 'SELECT id FROM t_overdoses WHERE user_id = ?', [userId]));
    run(
      db,
      `INSERT INTO r_diary_overdoses
        (diary_id, overdose_id, created_by, updated_by)
       VALUES (?, ?, ?, ?)`,
      [diaryId, overdoseId, userId, userId],
    );
    run(
      db,
      `INSERT INTO t_medication_intakes
        (user_id, user_medication_id, intake_date, adherence_score, created_by, updated_by)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, userMedicationId, '2026-11-06', 10, userId, userId],
    );
    run(
      db,
      `INSERT INTO t_bank_transactions
        (user_id, txn_date, txn_type, amount, memo, created_by, updated_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, '2026-11-06', '支払', 1200, '食費', userId, userId],
    );
    run(
      db,
      `INSERT INTO m_bank_purposes (user_id, name, text_color, created_by, updated_by)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, '食費', '#dc2626', userId, userId],
    );
    const purposeId = readId(getRow(db, 'SELECT id FROM m_bank_purposes WHERE user_id = ?', [userId]));
    run(db, 'UPDATE t_bank_transactions SET purpose_id = ? WHERE user_id = ?', [purposeId, userId]);

    expect(() => insertUser(db, 'Bad@Example.com')).toThrow();
    expect(() =>
      run(
        db,
        `INSERT INTO t_diaries (user_id, journal_date, sleep_quality, created_by, updated_by)
         VALUES (?, '2026-11-07', 11, ?, ?)`,
        [userId, userId, userId],
      ),
    ).toThrow();
    expect(() =>
      run(
        db,
        `INSERT INTO t_diaries (user_id, journal_date, systolic, diastolic, created_by, updated_by)
         VALUES (?, '2026-11-08', 80, 120, ?, ?)`,
        [userId, userId, userId],
      ),
    ).toThrow();
    expect(() =>
      run(
        db,
        `INSERT INTO t_bank_transactions
          (user_id, txn_date, txn_type, amount, memo, created_by, updated_by)
         VALUES (?, '2026-11-06', '支払', 1, ?, ?, ?)`,
        [userId, 'あ'.repeat(501), userId, userId],
      ),
    ).toThrow();
    expect(() =>
      run(
        db,
        `INSERT INTO m_bank_purposes (user_id, name, text_color, created_by, updated_by)
         VALUES (?, ?, ?, ?, ?)`,
        [userId, '交通費', 'red', userId, userId],
      ),
    ).toThrow();
    expect(() =>
      run(db, `INSERT INTO t_sessions (user_id, token_hash, expires_at) VALUES (?, ?, ?)`, [
        999_999,
        'a'.repeat(64),
        '2026-12-06T00:00:00.000Z',
      ]),
    ).toThrow();
  });

  it('セッション行は本人の user_id だけを返す', async () => {
    const db = database();
    const sessions = asSessionDatabase(db);
    const userA = insertUser(db, 'session-a@example.com');
    const userB = insertUser(db, 'session-b@example.com');
    const now = new Date('2026-11-06T00:00:00.000Z');
    const expiresAt = new Date('2026-12-06T00:00:00.000Z');
    const credentialA = await createSessionCredential(userA, expiresAt);
    const credentialB = await createSessionCredential(userB, expiresAt);

    await saveSession(sessions, credentialA);
    await saveSession(sessions, credentialB);

    expect(await verifySession(sessions, credentialA.token, now)).toBe(userA);
    expect(await verifySession(sessions, credentialB.token, now)).toBe(userB);
    expect(await verifySession(sessions, credentialA.token, now)).not.toBe(userB);

    const stored = allRows(
      db,
      'SELECT user_id, token_hash FROM t_sessions WHERE user_id IN (?, ?) ORDER BY user_id',
      [userA, userB],
    );
    expect(stored.map((row) => row.token_hash)).toEqual([
      credentialA.tokenHash,
      credentialB.tokenHash,
    ]);
    expect(stored.some((row) => row.token_hash === credentialA.token)).toBe(false);
  });

  it('期限切れ、失効済み、未知トークンは未認証', async () => {
    const db = database();
    const sessions = asSessionDatabase(db);
    const userId = insertUser(db, 'session-expiry@example.com');
    const now = new Date('2026-11-06T00:00:00.000Z');
    const expired = await createSessionCredential(userId, new Date('2026-11-05T00:00:00.000Z'));
    const revoked = await createSessionCredential(userId, new Date('2026-12-06T00:00:00.000Z'));
    const boundary = await createSessionCredential(userId, now);
    const active = await createSessionCredential(userId, new Date('2026-11-06T00:00:01.000Z'));

    await saveSession(sessions, expired);
    await saveSession(sessions, revoked);
    await saveSession(sessions, boundary);
    await saveSession(sessions, active);
    run(db, 'UPDATE t_sessions SET revoked_at = ? WHERE token_hash = ?', [
      now.toISOString(),
      revoked.tokenHash,
    ]);

    expect(await verifySession(sessions, expired.token, now)).toBeNull();
    expect(await verifySession(sessions, revoked.token, now)).toBeNull();
    expect(await verifySession(sessions, boundary.token, now)).toBeNull();
    expect(await verifySession(sessions, active.token, now)).toBe(userId);
    expect(await verifySession(sessions, 'unknown-token', now)).toBeNull();
  });

  function database(): DatabaseSync {
    if (!sqlite) {
      throw new Error('ローカル D1 が開いていません');
    }
    return sqlite;
  }
});

function applyMigrations(persistDir: string): void {
  try {
    execFileSync(
      process.execPath,
      [wranglerBin, 'd1', 'migrations', 'apply', 'auriary', '--local', '--persist-to', persistDir],
      {
        cwd: repoRoot,
        encoding: 'utf8',
        env: {
          ...process.env,
          CI: 'true',
          WRANGLER_SEND_METRICS: 'false',
        },
        maxBuffer: 10 * 1024 * 1024,
      },
    );
  } catch (error) {
    const stdout = readCommandOutput(error, 'stdout');
    const stderr = readCommandOutput(error, 'stderr');
    throw new Error(`ローカル D1 のマイグレーションに失敗しました\n${stdout}\n${stderr}`);
  }
}

function openMigratedDatabase(files: string[]): DatabaseSync {
  for (const file of files) {
    const db = new DatabaseSync(file);
    const row = db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 't_sessions'")
      .get();
    if (row) {
      db.exec('PRAGMA foreign_keys = ON');
      return db;
    }
    db.close();
  }
  throw new Error(`t_sessions のある SQLite が見つかりません: ${files.join(', ')}`);
}

function findSqliteFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) {
    return [];
  }
  const found: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      found.push(...findSqliteFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.sqlite')) {
      found.push(fullPath);
    }
  }
  return found;
}

function asSessionDatabase(db: DatabaseSync): SessionDatabase {
  return {
    prepare(query: string): SessionStatement {
      const statement = db.prepare(query);
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

function insertUser(db: DatabaseSync, email: string): number {
  run(db, 'INSERT INTO m_users (display_name, email, password_hash) VALUES (?, ?, ?)', [
    '表示名',
    email,
    'test-password-hash',
  ]);
  return readId(getRow(db, 'SELECT id FROM m_users WHERE email = ?', [email]));
}

function run(db: DatabaseSync, sql: string, params: Array<string | number | null> = []): void {
  db.prepare(sql).run(...params);
}

function getRow(
  db: DatabaseSync,
  sql: string,
  params: Array<string | number | null> = [],
): Record<string, unknown> | null {
  const row = db.prepare(sql).get(...params);
  if (row === undefined || row === null) {
    return null;
  }
  if (!isRecord(row)) {
    throw new Error('行の形が不正です');
  }
  return row;
}

function allRows(
  db: DatabaseSync,
  sql: string,
  params: Array<string | number | null> = [],
): Array<Record<string, unknown>> {
  const rows = db.prepare(sql).all(...params);
  if (!Array.isArray(rows)) {
    throw new Error('複数行の形が不正です');
  }
  return rows.map((row) => {
    if (!isRecord(row)) {
      throw new Error('行の形が不正です');
    }
    return row;
  });
}

function tableNames(db: DatabaseSync): string[] {
  return allRows(db, "SELECT name FROM sqlite_master WHERE type = 'table'").map((row) => {
    if (typeof row.name !== 'string') {
      throw new Error('テーブル名が不正です');
    }
    return row.name;
  });
}

function columnNames(db: DatabaseSync, table: string): string[] {
  return columnInfo(db, table).map((column) => column.name);
}

interface ColumnInfo {
  name: string;
  type: string;
  notnull: number;
}

function columnInfo(db: DatabaseSync, table: string): ColumnInfo[] {
  if (!/^[a-z_]+$/.test(table)) {
    throw new Error('テーブル名が不正です');
  }
  return allRows(db, `SELECT * FROM pragma_table_info('${table}')`).map((row) => {
    if (typeof row.name !== 'string' || typeof row.type !== 'string') {
      throw new Error('列情報が不正です');
    }
    return {
      name: row.name,
      type: row.type,
      notnull: typeof row.notnull === 'number' ? row.notnull : Number(row.notnull),
    };
  });
}

function columnType(columns: ColumnInfo[], name: string): string | undefined {
  return columns.find((column) => column.name === name)?.type;
}

function columnNotNull(columns: ColumnInfo[], name: string): number | undefined {
  return columns.find((column) => column.name === name)?.notnull;
}

function readId(row: Record<string, unknown> | null): number {
  const id = row?.id;
  if (typeof id === 'number' && Number.isSafeInteger(id)) {
    return id;
  }
  if (typeof id === 'bigint') {
    return Number(id);
  }
  throw new Error('id を読めませんでした');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readCommandOutput(error: unknown, key: 'stdout' | 'stderr'): string {
  if (typeof error !== 'object' || error === null) {
    return '';
  }
  const output = Reflect.get(error, key);
  return typeof output === 'string' ? output : '';
}
