/**
 * D1 の prepare().bind() を、セッションと日記が使う最小インターフェースに揃える。
 * D1 の all() は { results } を返す。node:sqlite の all() は行の配列を返す。
 */

import type { SessionDatabase, SessionSqlValue, SessionStatement } from '@/lib/auth/session';

interface RawStatement {
  bind(...values: readonly SessionSqlValue[]): unknown;
  run(): Promise<unknown>;
  first(): Promise<unknown>;
  all(): Promise<unknown>;
}

export interface D1LikeDatabase {
  prepare(query: string): RawStatement;
}

export function readD1Binding(env: unknown): D1LikeDatabase | null {
  if (!isRecord(env) || !('DB' in env)) {
    return null;
  }
  return asDatabase(env.DB);
}

export function asD1SessionDatabase(database: D1LikeDatabase): SessionDatabase {
  return {
    prepare(query: string): SessionStatement {
      let statement = database.prepare(query);
      const api: SessionStatement = {
        bind(...values: readonly SessionSqlValue[]) {
          const bound = asStatement(statement.bind(...values));
          if (bound) {
            statement = bound;
          }
          return api;
        },
        async run() {
          const result = await statement.run();
          const success = isRecord(result) && result.success === true;
          return { success };
        },
        async first() {
          const row = await statement.first();
          return row ?? null;
        },
        async all() {
          const result = await statement.all();
          if (Array.isArray(result)) {
            return result;
          }
          if (isRecord(result) && Array.isArray(result.results)) {
            return result.results;
          }
          return [];
        },
      };
      return api;
    },
  };
}

function asDatabase(value: unknown): D1LikeDatabase | null {
  if (!isRecord(value) || typeof value.prepare !== 'function') {
    return null;
  }
  const prepare = value.prepare;
  return {
    prepare(query: string) {
      const statement = asStatement(Reflect.apply(prepare, value, [query]));
      if (!statement) {
        throw new Error('D1 の prepare が失敗しました');
      }
      return statement;
    },
  };
}

function asStatement(value: unknown): RawStatement | null {
  if (!isRecord(value)) {
    return null;
  }
  const bind = value.bind;
  const run = value.run;
  const first = value.first;
  const all = value.all;
  if (
    typeof bind !== 'function' ||
    typeof run !== 'function' ||
    typeof first !== 'function' ||
    typeof all !== 'function'
  ) {
    return null;
  }
  return {
    bind(...values: readonly SessionSqlValue[]) {
      return Reflect.apply(bind, value, values);
    },
    run() {
      return Reflect.apply(run, value, []) as Promise<unknown>;
    },
    first() {
      return Reflect.apply(first, value, []) as Promise<unknown>;
    },
    all() {
      return Reflect.apply(all, value, []) as Promise<unknown>;
    },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
