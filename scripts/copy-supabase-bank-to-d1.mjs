/**
 * Supabase の銀行明細を、同じメールの遠隔 D1 とローカル D1 へコピーする。
 * Supabase は変更しない。摘要、メモ、鍵は出力しない。
 * 遠隔に同じ日付・区分・金額・摘要の行が既にある分は足さない。
 *
 *   node scripts/copy-supabase-bank-to-d1.mjs iq87io25@gmail.com
 */

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'node:path';

config({ path: resolve(process.cwd(), '.env.local') });

const email = process.argv[2]?.trim().toLowerCase();
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!email || !url || !key) {
  console.error('使い方: copy-supabase-bank-to-d1.mjs <email>');
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data: users, error: userError } = await supabase
  .from('m_users')
  .select('id, email')
  .ilike('email', email)
  .is('deleted_at', null);
if (userError || !users) {
  console.error('Supabase のユーザー取得に失敗しました');
  process.exit(1);
}
const sourceUser = users.find((row) => String(row.email).toLowerCase() === email);
if (!sourceUser) {
  console.error('Supabase に対象ユーザーがありません');
  process.exit(1);
}

const sourceRows = [];
const pageSize = 1000;
for (let from = 0; ; from += pageSize) {
  const { data, error } = await supabase
    .from('t_bank_transactions')
    .select(
      'txn_date, txn_type, amount, description, memo, source_file_name, source_id, created_at, updated_at, deleted_at',
    )
    .eq('user_id', sourceUser.id)
    .order('id', { ascending: true })
    .range(from, from + pageSize - 1);
  if (error) {
    console.error('Supabase の明細取得に失敗しました');
    process.exit(1);
  }
  sourceRows.push(...(data ?? []));
  if (!data || data.length < pageSize) {
    break;
  }
}

const remoteUser = remoteJson(
  `SELECT id FROM m_users WHERE email = ${sqlValue(email)} AND deleted_at IS NULL`,
);
const remoteUserId = Number(remoteUser?.id);
if (!Number.isInteger(remoteUserId) || remoteUserId <= 0) {
  console.error('遠隔 D1 に対象ユーザーがありません');
  process.exit(1);
}

const remoteRows = remoteAll(
  `SELECT txn_date, txn_type, amount, description FROM t_bank_transactions WHERE user_id = ${remoteUserId}`,
);
const pending = new Map();
for (const row of remoteRows) {
  const signature = signatureOf(row);
  pending.set(signature, (pending.get(signature) ?? 0) + 1);
}
const missing = sourceRows.filter((row) => {
  const signature = signatureOf(row);
  const left = pending.get(signature) ?? 0;
  if (left > 0) {
    pending.set(signature, left - 1);
    return false;
  }
  return true;
});

insertRemote(remoteUserId, missing);

const sqlitePath = findMigratedSqlite(path.join(process.cwd(), '.wrangler', 'state'));
const sqlite = new DatabaseSync(sqlitePath);
sqlite.exec('PRAGMA foreign_keys = ON');
const localUser = sqlite.prepare('SELECT id FROM m_users WHERE email = ?').get(email);
const localUserId = Number(localUser?.id);
let localInserted = 0;
if (Number.isInteger(localUserId) && localUserId > 0) {
  const localCount = sqlite
    .prepare('SELECT COUNT(*) AS n FROM t_bank_transactions WHERE user_id = ?')
    .get(localUserId);
  if (Number(localCount?.n ?? 0) === 0) {
    const insert = sqlite.prepare(
      `INSERT INTO t_bank_transactions (
        user_id, txn_date, txn_type, amount, description, memo, source_file_name, source_id,
        created_at, updated_at, deleted_at, created_by, updated_by, deleted_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    sqlite.exec('BEGIN');
    try {
      for (const row of sourceRows) {
        insert.run(
          localUserId,
          row.txn_date,
          row.txn_type,
          row.amount,
          row.description,
          row.memo,
          row.source_file_name,
          row.source_id,
          row.created_at,
          row.updated_at,
          row.deleted_at,
          localUserId,
          localUserId,
          row.deleted_at ? localUserId : null,
        );
        localInserted += 1;
      }
      sqlite.exec('COMMIT');
    } catch (error) {
      sqlite.exec('ROLLBACK');
      sqlite.close();
      throw error;
    }
  }
}
sqlite.close();

const remoteSummary = remoteJson(
  `SELECT COUNT(*) AS n FROM t_bank_transactions WHERE user_id = ${remoteUserId} AND deleted_at IS NULL`,
);
console.log(
  JSON.stringify({
    email,
    supabaseRows: sourceRows.length,
    remoteInserted: missing.length,
    remoteActiveRows: remoteSummary?.n ?? null,
    localInserted,
  }),
);

function signatureOf(row) {
  return [row.txn_date, row.txn_type, String(row.amount), row.description ?? ''].join('\u001f');
}

function insertRemote(userId, rows) {
  const columns = [
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
  ];
  const batchSize = 40;
  for (let index = 0; index < rows.length; index += batchSize) {
    const batch = rows.slice(index, index + batchSize);
    const values = batch
      .map((row) => {
        const deletedBy = row.deleted_at ? userId : null;
        return `(${[
          userId,
          row.txn_date,
          row.txn_type,
          row.amount,
          row.description,
          row.memo,
          row.source_file_name,
          row.source_id,
          row.created_at,
          row.updated_at,
          row.deleted_at,
          userId,
          userId,
          deletedBy,
        ]
          .map(sqlValue)
          .join(', ')})`;
      })
      .join(',\n');
    executeFile(`INSERT INTO t_bank_transactions (${columns.join(', ')}) VALUES\n${values};`);
    console.log(JSON.stringify({ remoteInserted: Math.min(index + batch.length, rows.length), total: rows.length }));
  }
}

function sqlValue(value) {
  if (value === null || value === undefined) {
    return 'NULL';
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? String(value) : 'NULL';
  }
  if (typeof value === 'bigint') {
    return value.toString();
  }
  return `'${String(value).replaceAll("'", "''")}'`;
}

function executeFile(sql) {
  const file = path.join(os.tmpdir(), `auriary-bank-${process.pid}-${Date.now()}.sql`);
  fs.writeFileSync(file, sql);
  try {
    const result = spawnSync(
      process.execPath,
      [
        path.join('node_modules', 'wrangler', 'bin', 'wrangler.js'),
        'd1',
        'execute',
        'auriary',
        '--remote',
        '--env',
        'production',
        '--file',
        file,
        '--json',
      ],
      {
        cwd: process.cwd(),
        env: { ...process.env, CI: 'true', WRANGLER_SEND_METRICS: 'false' },
        encoding: 'utf8',
      },
    );
    if (result.status !== 0) {
      throw new Error('遠隔 D1 への書き込みに失敗しました');
    }
  } finally {
    fs.rmSync(file, { force: true });
  }
}

function remoteJson(command) {
  return remoteAll(command)[0] ?? null;
}

function remoteAll(command) {
  const result = spawnSync(
    process.execPath,
    [
      path.join('node_modules', 'wrangler', 'bin', 'wrangler.js'),
      'd1',
      'execute',
      'auriary',
      '--remote',
      '--env',
      'production',
      '--json',
      '--command',
      command,
    ],
    {
      cwd: process.cwd(),
      env: { ...process.env, CI: 'true', WRANGLER_SEND_METRICS: 'false' },
      encoding: 'utf8',
    },
  );
  if (result.status !== 0) {
    throw new Error('遠隔 D1 の読み取りに失敗しました');
  }
  return JSON.parse(result.stdout)?.[0]?.results ?? [];
}

function findMigratedSqlite(dir) {
  for (const file of findSqliteFiles(dir)) {
    const db = new DatabaseSync(file);
    try {
      const row = db
        .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'm_users'")
        .get();
      if (row) {
        return file;
      }
    } finally {
      db.close();
    }
  }
  throw new Error('ローカル D1 がありません');
}

function findSqliteFiles(dir, found = []) {
  if (!fs.existsSync(dir)) {
    return found;
  }
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      findSqliteFiles(fullPath, found);
    } else if (entry.name.endsWith('.sqlite') && entry.name !== 'metadata.sqlite') {
      found.push(fullPath);
    }
  }
  return found;
}
