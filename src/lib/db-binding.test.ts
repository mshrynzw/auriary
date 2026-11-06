/**
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest';
import { asD1SessionDatabase, readD1Binding, type D1LikeDatabase } from './db-binding';

describe('readD1Binding', () => {
  it('DB が無い環境は binding なしとみなす', () => {
    expect(readD1Binding(null)).toBeNull();
    expect(readD1Binding({})).toBeNull();
    expect(readD1Binding({ DB: 'local' })).toBeNull();
  });

  it('prepare を持つ DB を binding として読む', () => {
    const database = readD1Binding({ DB: fakeDatabase() });
    expect(database).not.toBeNull();
  });
});

describe('asD1SessionDatabase', () => {
  it('D1 の results を行の配列にし、bind の値を渡す', async () => {
    const database = asD1SessionDatabase(fakeDatabase());
    const rows = await database.prepare('SELECT id FROM m_users WHERE email = ?').bind('a@b.c').all();

    expect(rows).toEqual([{ query: 'SELECT id FROM m_users WHERE email = ?', bound: ['a@b.c'] }]);
  });

  it('行が無い first は null、run は success を返す', async () => {
    const database = asD1SessionDatabase(fakeDatabase());
    const statement = database.prepare('DELETE FROM t_sessions WHERE token_hash = ?').bind('abc');

    expect(await statement.first()).toBeNull();
    expect(await statement.run()).toEqual({ success: true });
  });
});

function fakeDatabase(): D1LikeDatabase {
  return {
    prepare(query: string) {
      let bound: readonly unknown[] = [];
      return {
        bind(...values: readonly unknown[]) {
          bound = values;
          return this;
        },
        async run() {
          return { success: true };
        },
        async first() {
          return null;
        },
        async all() {
          return { results: [{ query, bound }] };
        },
      };
    },
  };
}
