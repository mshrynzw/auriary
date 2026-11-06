/**
 * ローカル D1 のユーザーと日記を、空の遠隔 D1（env.production）へコピーする。
 * Supabase は読まない。平文パスワード、ハッシュ、日記本文は出力しない。
 *
 *   node scripts/copy-local-user-to-remote-d1.mjs iq87io25@gmail.com
 */

import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const email = process.argv[2]?.trim().toLowerCase();
if (!email) {
  console.error('使い方: copy-local-user-to-remote-d1.mjs <email>');
  process.exit(1);
}

const sqlite = new DatabaseSync(findMigratedSqlite(path.join(process.cwd(), '.wrangler', 'state')));
sqlite.exec('PRAGMA foreign_keys = ON');

const user = sqlite
  .prepare(
    `SELECT display_name, family_name, first_name, family_name_kana, first_name_kana,
            email, password_hash, is_active, source_id, created_at, updated_at, deleted_at
     FROM m_users WHERE email = ? AND deleted_at IS NULL`,
  )
  .get(email);
if (!user) {
  sqlite.close();
  console.error('ローカル D1 に対象ユーザーがありません');
  process.exit(1);
}

const diaries = sqlite
  .prepare(
    `SELECT journal_date, sleep_start_at, sleep_end_at, bath_start_at, bath_end_at,
            sleep_quality, wake_level, daytime_level, pre_sleep_level, med_adherence_level,
            appetite_level, sleep_desire_level, exercise_level, bipolar_self_level, note,
            has_od, od_times, has_alcohol, alcohol_times, ai_summary, ai_topics, mood,
            sentiment_analysis_result, systolic, diastolic, pulse, source_id,
            created_at, updated_at, deleted_at, deleted_by
     FROM t_diaries WHERE user_id = (SELECT id FROM m_users WHERE email = ?)`,
  )
  .all(email);

const defaults = sqlite
  .prepare(
    `SELECT sleep_quality_default, wake_level_default, daytime_level_default, pre_sleep_level_default,
            med_adherence_level_default, appetite_level_default, sleep_desire_level_default,
            exercise_level_default, bipolar_self_level_default, sleep_start_at_default,
            sleep_end_at_default, bath_start_at_default, bath_end_at_default, source_id,
            created_at, updated_at, deleted_at
     FROM m_user_daily_defaults
     WHERE user_id = (SELECT id FROM m_users WHERE email = ?)`,
  )
  .get(email);

sqlite.close();

const existing = remoteJson(
  "SELECT COUNT(*) AS n FROM m_users WHERE email = '" + email.replaceAll("'", "''") + "'",
);
const existingCount = Number(existing?.n ?? 0);
if (existingCount > 0) {
  console.error('遠隔 D1 に同じメールアドレスが既にあります。中断しました');
  process.exit(1);
}

const userSql = `INSERT INTO m_users (
  display_name, family_name, first_name, family_name_kana, first_name_kana,
  email, password_hash, is_active, source_id, created_at, updated_at, deleted_at
) VALUES (
  ${sqlValue(user.display_name)}, ${sqlValue(user.family_name)}, ${sqlValue(user.first_name)},
  ${sqlValue(user.family_name_kana)}, ${sqlValue(user.first_name_kana)}, ${sqlValue(user.email)},
  ${sqlValue(user.password_hash)}, ${sqlValue(user.is_active)}, ${sqlValue(user.source_id)},
  ${sqlValue(user.created_at)}, ${sqlValue(user.updated_at)}, ${sqlValue(user.deleted_at)}
);
UPDATE m_users SET created_by = id, updated_by = id WHERE email = ${sqlValue(user.email)};`;
executeFile(userSql);

const remoteUser = remoteJson(
  "SELECT id FROM m_users WHERE email = '" + email.replaceAll("'", "''") + "'",
);
const userId = Number(remoteUser?.id);
if (!Number.isInteger(userId) || userId <= 0) {
  console.error('遠隔 D1 にユーザーを作れませんでした');
  process.exit(1);
}

if (defaults) {
  executeFile(`INSERT INTO m_user_daily_defaults (
    user_id, sleep_quality_default, wake_level_default, daytime_level_default, pre_sleep_level_default,
    med_adherence_level_default, appetite_level_default, sleep_desire_level_default, exercise_level_default,
    bipolar_self_level_default, sleep_start_at_default, sleep_end_at_default, bath_start_at_default,
    bath_end_at_default, source_id, created_at, updated_at, deleted_at, created_by, updated_by
  ) VALUES (
    ${userId}, ${sqlValue(defaults.sleep_quality_default)}, ${sqlValue(defaults.wake_level_default)},
    ${sqlValue(defaults.daytime_level_default)}, ${sqlValue(defaults.pre_sleep_level_default)},
    ${sqlValue(defaults.med_adherence_level_default)}, ${sqlValue(defaults.appetite_level_default)},
    ${sqlValue(defaults.sleep_desire_level_default)}, ${sqlValue(defaults.exercise_level_default)},
    ${sqlValue(defaults.bipolar_self_level_default)}, ${sqlValue(defaults.sleep_start_at_default)},
    ${sqlValue(defaults.sleep_end_at_default)}, ${sqlValue(defaults.bath_start_at_default)},
    ${sqlValue(defaults.bath_end_at_default)}, ${sqlValue(defaults.source_id)},
    ${sqlValue(defaults.created_at)}, ${sqlValue(defaults.updated_at)}, ${sqlValue(defaults.deleted_at)},
    ${userId}, ${userId}
  );`);
}

const diaryColumns = [
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
];

let inserted = 0;
const batchSize = 20;
for (let index = 0; index < diaries.length; index += batchSize) {
  const batch = diaries.slice(index, index + batchSize);
  const values = batch
    .map((diary) => {
      const deletedBy = diary.deleted_at ? userId : null;
      const fields = [
        userId,
        diary.journal_date,
        diary.sleep_start_at,
        diary.sleep_end_at,
        diary.bath_start_at,
        diary.bath_end_at,
        diary.sleep_quality,
        diary.wake_level,
        diary.daytime_level,
        diary.pre_sleep_level,
        diary.med_adherence_level,
        diary.appetite_level,
        diary.sleep_desire_level,
        diary.exercise_level,
        diary.bipolar_self_level,
        diary.note,
        diary.has_od,
        diary.od_times,
        diary.has_alcohol,
        diary.alcohol_times,
        diary.ai_summary,
        diary.ai_topics,
        diary.mood,
        diary.sentiment_analysis_result,
        diary.systolic,
        diary.diastolic,
        diary.pulse,
        diary.source_id,
        diary.created_at,
        diary.updated_at,
        diary.deleted_at,
        userId,
        userId,
        deletedBy,
      ];
      return `(${fields.map(sqlValue).join(', ')})`;
    })
    .join(',\n');
  executeFile(
    `INSERT INTO t_diaries (${diaryColumns.join(', ')}) VALUES\n${values};`,
  );
  inserted += batch.length;
  console.log(JSON.stringify({ inserted, total: diaries.length }));
}

const summary = remoteJson(
  `SELECT (SELECT COUNT(*) FROM m_users WHERE email = ${sqlValue(email)}) AS users, (SELECT COUNT(*) FROM t_diaries WHERE user_id = ${userId}) AS diaries`,
);
console.log(JSON.stringify({ email, remoteUsers: summary?.users ?? null, remoteDiaries: summary?.diaries ?? null }));

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
  const file = path.join(os.tmpdir(), `auriary-remote-${process.pid}-${Date.now()}.sql`);
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
      const message = result.stderr || result.stdout || '遠隔 D1 への書き込みに失敗しました';
      throw new Error(redact(message));
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
    throw new Error(redact(result.stderr || '遠隔 D1 の読み取りに失敗しました'));
  }
  const parsed = JSON.parse(result.stdout);
  const row = parsed?.[0]?.results?.[0];
  return row ?? null;
}

function redact(message) {
  return message.replace(/pbkdf2-sha256\$[0-9]+\$[0-9a-f]+\$[0-9a-f]+/g, '[redacted]');
}

function findMigratedSqlite(dir) {
  for (const file of findSqliteFiles(dir)) {
    const db = new DatabaseSync(file);
    try {
      const row = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 't_sessions'").get();
      const userTable = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'm_users'").get();
      if (row && userTable) {
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
