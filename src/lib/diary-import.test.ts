/**
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest';
import { toD1Diary } from './diary-import';

describe('toD1Diary', () => {
  it('Supabase の真偽値と JSON を D1 の整数と文字列にする', () => {
    const mapped = toD1Diary(
      {
        id: 42,
        journal_date: '2026-11-01',
        note: '残したい記録',
        has_od: true,
        od_times: [{ occurred_at: '2026-11-01T12:00:00.000Z' }],
        has_alcohol: false,
        alcohol_times: [],
        mood: 7,
        sentiment_analysis_result: { sentiment: 'positive', score: 7 },
        created_at: '2026-11-01T00:00:00.000Z',
        updated_at: '2026-11-01T01:00:00.000Z',
        deleted_at: null,
      },
      3,
    );

    expect(mapped.source_id).toBe(42);
    expect(mapped.journal_date).toBe('2026-11-01');
    expect(mapped.has_od).toBe(1);
    expect(mapped.has_alcohol).toBe(0);
    expect(mapped.od_times).toBe('[{"occurred_at":"2026-11-01T12:00:00.000Z"}]');
    expect(mapped.alcohol_times).toBe('[]');
    expect(mapped.created_by).toBe(3);
    expect(mapped.updated_by).toBe(3);
    expect(mapped.deleted_by).toBeNull();
    expect(mapped.note).toBe('残したい記録');
  });

  it('削除済みの日記は deleted_by を移行先ユーザーにする', () => {
    const mapped = toD1Diary(
      {
        id: '9',
        journal_date: '2026-10-02T00:00:00.000Z',
        deleted_at: '2026-10-03T00:00:00.000Z',
        created_at: '2026-10-02T00:00:00.000Z',
        updated_at: '2026-10-03T00:00:00.000Z',
      },
      8,
    );

    expect(mapped.source_id).toBe(9);
    expect(mapped.journal_date).toBe('2026-10-02');
    expect(mapped.deleted_at).toBe('2026-10-03T00:00:00.000Z');
    expect(mapped.deleted_by).toBe(8);
  });
});
