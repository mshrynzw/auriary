import { describe, it, expect } from 'vitest';
import { createDiaryFormSchema, updateDiaryFormSchema } from '@/schemas';

describe('createDiaryFormSchema', () => {
  it('有効な日記データを検証する', () => {
    const data = {
      journal_date: '2025-01-10',
      note: 'Test note',
      sleep_quality: 5,
      wake_level: 4,
      daytime_level: 3,
    };
    expect(createDiaryFormSchema.parse(data)).toEqual(data);
  });

  it('無効な日付形式を拒否する', () => {
    const data = {
      journal_date: 'invalid-date',
      note: 'Test note',
    };
    expect(() => createDiaryFormSchema.parse(data)).toThrow();
  });

  it('note が 10000 文字を超える場合にエラーを投げる', () => {
    const data = {
      journal_date: '2025-01-10',
      note: 'a'.repeat(10001),
    };
    expect(() => createDiaryFormSchema.parse(data)).toThrow();
  });

  it('sleep_quality が範囲外の値を拒否する', () => {
    const data = {
      journal_date: '2025-01-10',
      sleep_quality: 6, // 1-5の範囲外
    };
    expect(() => createDiaryFormSchema.parse(data)).toThrow();
  });

  it('オプショナルフィールドが欠けていても有効', () => {
    const data = {
      journal_date: '2025-01-10',
    };
    expect(createDiaryFormSchema.parse(data)).toEqual(data);
  });
});

describe('updateDiaryFormSchema', () => {
  it('部分的な更新を許可する', () => {
    const data = {
      note: 'Updated note',
    };
    expect(updateDiaryFormSchema.parse(data)).toEqual(data);
  });

  it('空のオブジェクトも有効', () => {
    expect(updateDiaryFormSchema.parse({})).toEqual({});
  });
});
