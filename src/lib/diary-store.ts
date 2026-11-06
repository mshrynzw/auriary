/**
 * t_diaries の読み書き。呼び出し側がセッションの user_id を渡す。
 */

import type { SessionDatabase, SessionSqlValue } from '@/lib/auth/session';
import type { DiaryRow } from '@/schemas';
import {
  asBoolean,
  escapeLike,
  execute,
  isRecord,
  isUniqueViolation,
  parseJson,
  queryAll,
  queryFirst,
  readId,
  readRows,
  toSqlJson,
} from './sql';

const JSON_COLUMNS = new Set([
  'od_times',
  'alcohol_times',
  'sentiment_analysis_result',
  'ai_topics',
]);
const BOOLEAN_COLUMNS = new Set(['has_od', 'has_alcohol']);

export type DiaryWriteResult =
  | { ok: true; diary: DiaryRow }
  | { ok: false; code: 'DUPLICATE_ERROR' | 'NOT_FOUND' | 'INTERNAL_ERROR'; message: string };

export async function insertDiary(
  db: SessionDatabase,
  userId: number,
  values: Record<string, unknown>,
  now: Date = new Date(),
): Promise<DiaryWriteResult> {
  const timestamp = now.toISOString();
  const columns = [
    'user_id',
    'journal_date',
    'note',
    'mood',
    'sentiment_analysis_result',
    'sleep_quality',
    'bipolar_self_level',
    'wake_level',
    'daytime_level',
    'pre_sleep_level',
    'med_adherence_level',
    'appetite_level',
    'sleep_desire_level',
    'exercise_level',
    'systolic',
    'diastolic',
    'pulse',
    'has_od',
    'od_times',
    'has_alcohol',
    'alcohol_times',
    'sleep_start_at',
    'sleep_end_at',
    'bath_start_at',
    'bath_end_at',
    'created_at',
    'updated_at',
    'created_by',
    'updated_by',
  ];
  const params: SessionSqlValue[] = columns.map((column) => {
    if (column === 'user_id' || column === 'created_by' || column === 'updated_by') {
      return userId;
    }
    if (column === 'created_at' || column === 'updated_at') {
      return timestamp;
    }
    return toColumnValue(column, values[column]);
  });

  try {
    await execute(
      db,
      `INSERT INTO t_diaries (${columns.join(', ')}) VALUES (${columns.map(() => '?').join(', ')})`,
      params,
    );
  } catch (error) {
    if (isUniqueViolation(error)) {
      return { ok: false, code: 'DUPLICATE_ERROR', message: 'この日付の日記は既に存在します' };
    }
    throw error;
  }

  const diary = await findDiaryByDate(db, userId, String(values.journal_date ?? ''));
  if (!diary) {
    return { ok: false, code: 'INTERNAL_ERROR', message: '日記の作成に失敗しました' };
  }
  return { ok: true, diary };
}

export async function updateDiary(
  db: SessionDatabase,
  userId: number,
  diaryId: number,
  values: Record<string, unknown>,
  now: Date = new Date(),
): Promise<DiaryWriteResult> {
  const existing = await findOwnedDiary(db, userId, diaryId);
  if (!existing) {
    return { ok: false, code: 'NOT_FOUND', message: '日記が見つかりません' };
  }

  const assignments = ['updated_at = ?', 'updated_by = ?'];
  const params: SessionSqlValue[] = [now.toISOString(), userId];
  for (const [column, value] of Object.entries(values)) {
    if (!isWritableColumn(column) || value === undefined) {
      continue;
    }
    assignments.push(`${column} = ?`);
    params.push(toColumnValue(column, value));
  }
  params.push(diaryId, userId);

  try {
    await execute(
      db,
      `UPDATE t_diaries SET ${assignments.join(', ')} WHERE id = ? AND user_id = ? AND deleted_at IS NULL`,
      params,
    );
  } catch (error) {
    if (isUniqueViolation(error)) {
      return { ok: false, code: 'DUPLICATE_ERROR', message: 'この日付の日記は既に存在します' };
    }
    throw error;
  }

  const diary = await findOwnedDiary(db, userId, diaryId);
  if (!diary) {
    return { ok: false, code: 'INTERNAL_ERROR', message: '日記の更新に失敗しました' };
  }
  return { ok: true, diary };
}

export async function softDeleteDiary(
  db: SessionDatabase,
  userId: number,
  diaryId: number,
  now: Date = new Date(),
): Promise<{ ok: true } | { ok: false; code: 'NOT_FOUND'; message: string }> {
  const existing = await findOwnedDiary(db, userId, diaryId);
  if (!existing) {
    return { ok: false, code: 'NOT_FOUND', message: '日記が見つかりません' };
  }
  await execute(
    db,
    'UPDATE t_diaries SET deleted_at = ?, deleted_by = ? WHERE id = ? AND user_id = ? AND deleted_at IS NULL',
    [now.toISOString(), userId, diaryId, userId],
  );
  return { ok: true };
}

export async function listDiaries(
  db: SessionDatabase,
  userId: number,
  params?: {
    start_date?: string;
    end_date?: string;
    keyword?: string;
    limit?: number;
    offset?: number;
  },
): Promise<DiaryRow[]> {
  const where = ['user_id = ?', 'deleted_at IS NULL'];
  const values: SessionSqlValue[] = [userId];
  if (params?.start_date) {
    where.push('journal_date >= ?');
    values.push(params.start_date);
  }
  if (params?.end_date) {
    where.push('journal_date <= ?');
    values.push(params.end_date);
  }
  const keyword = params?.keyword?.trim();
  if (keyword) {
    where.push("IFNULL(note, '') LIKE ? ESCAPE '\\'");
    values.push(`%${escapeLike(keyword)}%`);
  }

  let sql = `SELECT * FROM t_diaries WHERE ${where.join(' AND ')} ORDER BY journal_date DESC`;
  if (params?.limit !== undefined || params?.offset !== undefined) {
    sql += ' LIMIT ? OFFSET ?';
    values.push(params.limit ?? -1, params.offset ?? 0);
  }

  const rows = await queryAll(db, sql, values);
  return readRows(rows).map(toDiaryRow);
}

export async function findOwnedDiary(
  db: SessionDatabase,
  userId: number,
  diaryId: number,
): Promise<DiaryRow | null> {
  const row = await queryFirst(
    db,
    'SELECT * FROM t_diaries WHERE id = ? AND user_id = ? AND deleted_at IS NULL',
    [diaryId, userId],
  );
  return isRecord(row) ? toDiaryRow(row) : null;
}

export async function findEarliestJournalDate(
  db: SessionDatabase,
  userId: number,
): Promise<string | null> {
  const row = await queryFirst(
    db,
    'SELECT journal_date FROM t_diaries WHERE user_id = ? AND deleted_at IS NULL ORDER BY journal_date ASC LIMIT 1',
    [userId],
  );
  if (!isRecord(row) || typeof row.journal_date !== 'string') {
    return null;
  }
  return row.journal_date;
}

async function findDiaryByDate(
  db: SessionDatabase,
  userId: number,
  journalDate: string,
): Promise<DiaryRow | null> {
  const row = await queryFirst(
    db,
    'SELECT * FROM t_diaries WHERE user_id = ? AND journal_date = ? AND deleted_at IS NULL',
    [userId, journalDate],
  );
  return isRecord(row) ? toDiaryRow(row) : null;
}

const WRITABLE_COLUMNS = new Set([
  'journal_date',
  'note',
  'mood',
  'sentiment_analysis_result',
  'sleep_quality',
  'bipolar_self_level',
  'wake_level',
  'daytime_level',
  'pre_sleep_level',
  'med_adherence_level',
  'appetite_level',
  'sleep_desire_level',
  'exercise_level',
  'systolic',
  'diastolic',
  'pulse',
  'has_od',
  'od_times',
  'has_alcohol',
  'alcohol_times',
  'sleep_start_at',
  'sleep_end_at',
  'bath_start_at',
  'bath_end_at',
  'ai_summary',
  'ai_topics',
]);

function isWritableColumn(column: string): boolean {
  return WRITABLE_COLUMNS.has(column);
}

function toColumnValue(column: string, value: unknown): SessionSqlValue {
  if (value === undefined || value === '') {
    return null;
  }
  if (BOOLEAN_COLUMNS.has(column)) {
    return value ? 1 : 0;
  }
  if (JSON_COLUMNS.has(column)) {
    return toSqlJson(value);
  }
  if (typeof value === 'number' || typeof value === 'string' || value === null) {
    return value;
  }
  return null;
}

function toDiaryRow(row: Record<string, unknown>): DiaryRow {
  const id = readId(row.id);
  return {
    ...row,
    id,
    user_id: readId(row.user_id),
    has_od: asBoolean(row.has_od),
    has_alcohol: asBoolean(row.has_alcohol),
    od_times: parseJson(row.od_times),
    alcohol_times: parseJson(row.alcohol_times),
    sentiment_analysis_result: parseJson(row.sentiment_analysis_result),
    ai_topics: parseJson(row.ai_topics),
  } as DiaryRow;
}
