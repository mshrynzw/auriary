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
import { findOwnedDiary, insertDiary, listDiaries, softDeleteDiary } from '@/lib/diary-store';

const schemaPath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../../migrations/0001_initial_schema.sql',
);

describe('D1 の日記', () => {
  let sqlite: DatabaseSync;

  beforeAll(() => {
    sqlite = new DatabaseSync(':memory:');
    sqlite.exec('PRAGMA foreign_keys = ON');
    sqlite.exec(fs.readFileSync(schemaPath, 'utf8'));
  });

  afterAll(() => {
    sqlite.close();
  });

  it('作成した日記は本人だけが読め、削除すると一覧から消える', async () => {
    const db = asSessionDatabase(sqlite);
    const owner = await registerAccount(db, {
      email: 'diary-owner@example.com',
      password: 'testpassword123',
      displayName: '本人',
    });
    const other = await registerAccount(db, {
      email: 'diary-other@example.com',
      password: 'testpassword123',
      displayName: '他人',
    });
    expect(owner.ok && other.ok).toBe(true);
    if (!owner.ok || !other.ok) {
      return;
    }

    const created = await insertDiary(db, owner.user.id, {
      journal_date: '2026-11-06',
      note: '本人の日記',
    });
    expect(created.ok).toBe(true);
    if (!created.ok) {
      return;
    }

    const ownList = await listDiaries(db, owner.user.id);
    const otherList = await listDiaries(db, other.user.id);
    expect(ownList.map((diary) => diary.note)).toEqual(['本人の日記']);
    expect(otherList).toEqual([]);
    expect(await findOwnedDiary(db, other.user.id, Number(created.diary.id))).toBeNull();

    const duplicate = await insertDiary(db, owner.user.id, {
      journal_date: '2026-11-06',
      note: '同じ日',
    });
    expect(duplicate.ok).toBe(false);

    const removed = await softDeleteDiary(db, other.user.id, Number(created.diary.id));
    expect(removed.ok).toBe(false);
    expect((await listDiaries(db, owner.user.id)).length).toBe(1);

    expect((await softDeleteDiary(db, owner.user.id, Number(created.diary.id))).ok).toBe(true);
    expect(await listDiaries(db, owner.user.id)).toEqual([]);
  });

  it('キーワード検索は本人の本文だけを返す', async () => {
    const db = asSessionDatabase(sqlite);
    const owner = await registerAccount(db, {
      email: 'diary-search@example.com',
      password: 'testpassword123',
      displayName: '検索',
    });
    expect(owner.ok).toBe(true);
    if (!owner.ok) {
      return;
    }

    await insertDiary(db, owner.user.id, { journal_date: '2026-11-01', note: '朝の散歩' });
    await insertDiary(db, owner.user.id, { journal_date: '2026-11-02', note: '夜の読書' });

    const found = await listDiaries(db, owner.user.id, { keyword: '散歩' });
    expect(found.map((diary) => diary.journal_date)).toEqual(['2026-11-01']);
  });
});

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
