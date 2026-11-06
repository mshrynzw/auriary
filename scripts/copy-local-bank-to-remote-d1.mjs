/**
 * ローカル D1 の銀行明細を、同じメールの遠隔ユーザーへコピーする。
 * 摘要とメモは出力しない。遠隔に既に明細があるときは中断する。
 *
 *   node scripts/copy-local-bank-to-remote-d1.mjs iq87io25@gmail.com
 */

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const email = process.argv[2]?.trim().toLowerCase();
if (!email) {
  console.error('使い方: copy-local-bank-to-remote-d1.mjs <email>');
  process.exit(1);
}

const sqlite = new DatabaseSync(findMigratedSqlite(path.join(process.cwd(), '.wrangler', 'state')));
const rows = sqlite
  .prepare(
    `SELECT txn_date, txn_type, amount, description, memo, source_file_name, source_id,
            created_at, updated_at, deleted_at
     FROM t_bank_transactions
     WHERE user_id = (SELECT id FROM m_users WHERE email = ?)`,
  )
  .all(email);
sqlite.close();

const remoteUser = remoteJson(
  `SELECT id FROM m_users WHERE email = ${sqlValue(email)} AND deleted_at IS NULL`,
);
const userId = Number(remoteUser?.id);
if (!Number.isInteger(userId) || userId <= 0) {
  console.error('遠隔 D1 に対象ユーザーがありません');
  process.exit(1);
}

const existing = remoteJson(
  `SELECT COUNT(*) AS n FROM t_bank_transactions WHERE user_id = ${userId}`,
);
if (Number(existing?.n ?? 0) > 0) {
  console.error('遠隔 D1 に明細が既にあります。中断しました');
  process.exit(1);
}

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

let inserted = 0;
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
  inserted += batch.length;
  console.log(JSON.stringify({ inserted, total: rows.length }));
}

const summary = remoteJson(
  `SELECT COUNT(*) AS bankRows FROM t_bank_transactions WHERE user_id = ${userId} AND deleted_at IS NULL`,
);
console.log(JSON.stringify({ email, remoteActiveBankRows: summary?.bankRows ?? null }));

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
      throw new Error(result.stderr || '遠隔 D1 への書き込みに失敗しました');
    }
  } finally {
    fs.rmSync(file, { force: true });
  }
}

function remoteJson(command) {
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
    throw new Error(result.stderr || '遠隔 D1 の読み取りに失敗しました');
  }
  return JSON.parse(result.stdout)?.[0]?.results?.[0] ?? null;
}

function findMigratedSqlite(dir) {
  for (const file of findSqliteFiles(dir)) {
    const db = new DatabaseSync(file);
    try {
      const row = db
        .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 't_bank_transactions'")
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
