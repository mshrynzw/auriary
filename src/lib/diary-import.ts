/**
 * Supabase の日記行を、D1 の t_diaries に入れられる値へ変換する。
 * パスワードや本文はここではログに出さない。
 */

export interface D1DiaryInsert {
  journal_date: string;
  sleep_start_at: string | null;
  sleep_end_at: string | null;
  bath_start_at: string | null;
  bath_end_at: string | null;
  sleep_quality: number | null;
  wake_level: number | null;
  daytime_level: number | null;
  pre_sleep_level: number | null;
  med_adherence_level: number | null;
  appetite_level: number | null;
  sleep_desire_level: number | null;
  exercise_level: number | null;
  bipolar_self_level: number | null;
  note: string | null;
  has_od: number;
  od_times: string;
  has_alcohol: number;
  alcohol_times: string;
  ai_summary: string | null;
  ai_topics: string | null;
  mood: number | null;
  sentiment_analysis_result: string | null;
  systolic: number | null;
  diastolic: number | null;
  pulse: number | null;
  source_id: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  created_by: number;
  updated_by: number;
  deleted_by: number | null;
}

export function toD1Diary(row: Record<string, unknown>, userId: number): D1DiaryInsert {
  const journalDate = asDate(row.journal_date);
  const sourceId = asInt(row.id);
  if (!journalDate || sourceId === null) {
    throw new Error('日記の日付または id が不正です');
  }

  const deletedAt = asTimestamp(row.deleted_at);
  return {
    journal_date: journalDate,
    sleep_start_at: asTimestamp(row.sleep_start_at),
    sleep_end_at: asTimestamp(row.sleep_end_at),
    bath_start_at: asTimestamp(row.bath_start_at),
    bath_end_at: asTimestamp(row.bath_end_at),
    sleep_quality: asInt(row.sleep_quality),
    wake_level: asInt(row.wake_level),
    daytime_level: asInt(row.daytime_level),
    pre_sleep_level: asInt(row.pre_sleep_level),
    med_adherence_level: asInt(row.med_adherence_level),
    appetite_level: asInt(row.appetite_level),
    sleep_desire_level: asInt(row.sleep_desire_level),
    exercise_level: asInt(row.exercise_level),
    bipolar_self_level: asInt(row.bipolar_self_level),
    note: asText(row.note),
    has_od: asFlag(row.has_od),
    od_times: asJsonText(row.od_times, '[]'),
    has_alcohol: asFlag(row.has_alcohol),
    alcohol_times: asJsonText(row.alcohol_times, '[]'),
    ai_summary: asText(row.ai_summary),
    ai_topics: asJsonText(row.ai_topics, null),
    mood: asInt(row.mood),
    sentiment_analysis_result: asJsonText(row.sentiment_analysis_result, null),
    systolic: asInt(row.systolic),
    diastolic: asInt(row.diastolic),
    pulse: asInt(row.pulse),
    source_id: sourceId,
    created_at: asTimestamp(row.created_at) ?? new Date(0).toISOString(),
    updated_at: asTimestamp(row.updated_at) ?? new Date(0).toISOString(),
    deleted_at: deletedAt,
    created_by: userId,
    updated_by: userId,
    deleted_by: deletedAt ? userId : null,
  };
}

function asText(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function asInt(value: unknown): number | null {
  if (typeof value === 'number' && Number.isInteger(value)) {
    return value;
  }
  if (typeof value === 'string' && /^-?\d+$/.test(value)) {
    return Number(value);
  }
  return null;
}

function asFlag(value: unknown): number {
  if (value === true || value === 1 || value === 'true') {
    return 1;
  }
  return 0;
}

function asDate(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  const match = /^(\d{4}-\d{2}-\d{2})/.exec(value);
  return match?.[1] ?? null;
}

function asTimestamp(value: unknown): string | null {
  if (typeof value !== 'string' || value.length === 0) {
    return null;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed.toISOString();
}

function asJsonText(value: unknown, empty: string): string;
function asJsonText(value: unknown, empty: null): string | null;
function asJsonText(value: unknown, empty: string | null): string | null {
  if (value === null || value === undefined) {
    return empty;
  }
  if (typeof value === 'string') {
    return value.length > 0 ? value : empty;
  }
  return JSON.stringify(value);
}
