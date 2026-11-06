/**
 * 指定メールの Supabase 日記を、ローカル D1 の同じメールのユーザーへコピーする。
 * 同じ日付が既にある行は上書きしない。Supabase は変更しない。
 * 本文、パスワード、鍵は出力しない。
 *
 *   node ./node_modules/tsx/dist/cli.mjs scripts/copy-diaries-to-d1.ts user@example.com
 */

import { config } from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { createClient } from '@supabase/supabase-js';
import { toD1Diary, type D1DiaryInsert } from '../src/lib/diary-import';

config({ path: resolve(process.cwd(), '.env.local') });

const email = process.argv[2]?.trim().toLowerCase();
const localEmail = (process.argv[3] ?? email)?.trim().toLowerCase();
if (!email || !localEmail) {
  console.error('使い方: copy-diaries-to-d1.ts <supabaseのメール> [ローカルD1のメール]');
  process.exit(1);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceRoleKey) {
  console.error('Supabase の URL または service role がありません');
  process.exit(1);
}

const sqlitePath = findMigratedSqlite(path.join(process.cwd(), '.wrangler', 'state'));
const sqlite = new DatabaseSync(sqlitePath);
sqlite.exec('PRAGMA foreign_keys = ON');

const localUser = sqlite.prepare('SELECT id FROM m_users WHERE email = ?').get(localEmail);
const userId = readId(isRecord(localUser) ? localUser.id : null);
if (userId === null) {
  console.error(
    `ローカル D1 に ${localEmail} がありません。先にそのメールアドレスで登録してください`,
  );
  process.exit(1);
}
const ownerId = userId;

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

copyDiaries().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'コピーに失敗しました');
  process.exit(1);
});

async function copyDiaries() {
const { data: profiles, error: profileError } = await supabase
  .from('m_users')
  .select('id, email')
  .ilike('email', email)
  .is('deleted_at', null);

if (profileError) {
  sqlite.close();
  console.error('Supabase のユーザー取得に失敗しました');
  process.exit(1);
}

const profile = (profiles ?? []).find(
  (row) => typeof row.email === 'string' && row.email.toLowerCase() === email,
);
if (!profile) {
  sqlite.close();
  console.error(`Supabase に ${email} のユーザーがありません`);
  process.exit(1);
}

const { data: diaries, error: diaryError } = await supabase
  .from('t_diaries')
  .select('*')
  .eq('user_id', profile.id);

if (diaryError || !diaries) {
  console.error('Supabase の日記取得に失敗しました');
  process.exit(1);
}

let inserted = 0;
let updated = 0;
let skipped = 0;
const skippedDates: string[] = [];

const existing = sqlite.prepare(
  'SELECT journal_date FROM t_diaries WHERE user_id = ?',
);
const existingRows = existing.all(ownerId);
const existingDates = new Set(
  (Array.isArray(existingRows) ? existingRows : [])
    .filter(isRecord)
    .map((row) => (typeof row.journal_date === 'string' ? row.journal_date : ''))
    .filter((date) => date.length > 0),
);

const insert = sqlite.prepare(
  `INSERT INTO t_diaries (
    user_id, journal_date, sleep_start_at, sleep_end_at, bath_start_at, bath_end_at,
    sleep_quality, wake_level, daytime_level, pre_sleep_level, med_adherence_level,
    appetite_level, sleep_desire_level, exercise_level, bipolar_self_level, note,
    has_od, od_times, has_alcohol, alcohol_times, ai_summary, ai_topics, mood,
    sentiment_analysis_result, systolic, diastolic, pulse, source_id,
    created_at, updated_at, deleted_at, created_by, updated_by, deleted_by
  ) VALUES (
    ?, ?, ?, ?, ?, ?,
    ?, ?, ?, ?, ?,
    ?, ?, ?, ?, ?,
    ?, ?, ?, ?, ?, ?, ?,
    ?, ?, ?, ?, ?,
    ?, ?, ?, ?, ?, ?
  )`,
);

for (const row of diaries) {
  if (!isRecord(row)) {
    continue;
  }
  const mapped = toD1Diary(row, ownerId);
  if (existingDates.has(mapped.journal_date)) {
    const current = sqlite
      .prepare(
        'SELECT note, source_id FROM t_diaries WHERE user_id = ? AND journal_date = ?',
      )
      .get(ownerId, mapped.journal_date);
    const note = isRecord(current) ? current.note : null;
    const sourceId = isRecord(current) ? current.source_id : null;
    const localNoteEmpty = note === null || note === '';
    if (localNoteEmpty && sourceId === null && mapped.note) {
      sqlite
        .prepare(
          `UPDATE t_diaries SET
            sleep_start_at = ?, sleep_end_at = ?, bath_start_at = ?, bath_end_at = ?,
            sleep_quality = ?, wake_level = ?, daytime_level = ?, pre_sleep_level = ?,
            med_adherence_level = ?, appetite_level = ?, sleep_desire_level = ?,
            exercise_level = ?, bipolar_self_level = ?, note = ?, has_od = ?, od_times = ?,
            has_alcohol = ?, alcohol_times = ?, ai_summary = ?, ai_topics = ?, mood = ?,
            sentiment_analysis_result = ?, systolic = ?, diastolic = ?, pulse = ?,
            source_id = ?, updated_at = ?, deleted_at = ?, updated_by = ?, deleted_by = ?
          WHERE user_id = ? AND journal_date = ?`,
        )
        .run(
          mapped.sleep_start_at,
          mapped.sleep_end_at,
          mapped.bath_start_at,
          mapped.bath_end_at,
          mapped.sleep_quality,
          mapped.wake_level,
          mapped.daytime_level,
          mapped.pre_sleep_level,
          mapped.med_adherence_level,
          mapped.appetite_level,
          mapped.sleep_desire_level,
          mapped.exercise_level,
          mapped.bipolar_self_level,
          mapped.note,
          mapped.has_od,
          mapped.od_times,
          mapped.has_alcohol,
          mapped.alcohol_times,
          mapped.ai_summary,
          mapped.ai_topics,
          mapped.mood,
          mapped.sentiment_analysis_result,
          mapped.systolic,
          mapped.diastolic,
          mapped.pulse,
          mapped.source_id,
          mapped.updated_at,
          mapped.deleted_at,
          mapped.updated_by,
          mapped.deleted_by,
          ownerId,
          mapped.journal_date,
        );
      updated += 1;
      continue;
    }
    skipped += 1;
    skippedDates.push(mapped.journal_date);
    continue;
  }
  try {
    insert.run(...insertParams(ownerId, mapped));
    inserted += 1;
  } catch {
    skipped += 1;
    skippedDates.push(mapped.journal_date);
  }
}

let emailUpdated = false;
if (localEmail !== email) {
  const taken = sqlite
    .prepare('SELECT id FROM m_users WHERE email = ? AND id != ?')
    .get(email, ownerId);
  if (!taken) {
    sqlite
      .prepare('UPDATE m_users SET email = ?, updated_at = ? WHERE id = ?')
      .run(email, new Date().toISOString(), ownerId);
    emailUpdated = true;
  }
}

console.log(
  JSON.stringify({
    email,
    localEmail,
    emailUpdated,
    supabaseDiaryCount: diaries.length,
    inserted,
    updated,
    skipped,
    skippedDates,
  }),
);

sqlite.close();
}

function insertParams(ownerId: number, diary: D1DiaryInsert): Array<string | number | null> {
  return [
    ownerId,
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
    diary.created_by,
    diary.updated_by,
    diary.deleted_by,
  ];
}

function readId(value: unknown): number | null {
  if (typeof value === 'number' && Number.isSafeInteger(value) && value > 0) {
    return value;
  }
  if (typeof value === 'bigint' && value > BigInt(0)) {
    return Number(value);
  }
  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function findMigratedSqlite(dir: string): string {
  for (const file of findSqliteFiles(dir)) {
    const db = new DatabaseSync(file);
    try {
      const row = db
        .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 't_sessions'")
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

function findSqliteFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) {
    return [];
  }
  const found: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      found.push(...findSqliteFiles(fullPath));
    } else if (entry.name.endsWith('.sqlite')) {
      found.push(fullPath);
    }
  }
  return found;
}
