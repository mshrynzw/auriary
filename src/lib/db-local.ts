/**
 * next dev で D1 の binding が取れないときのフォールバック。
 * `pnpm d1:migrate:local` が作った .wrangler 配下のファイルを使う。
 * 遠隔の D1 には繋がない。
 */

import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import type { SessionDatabase, SessionSqlValue, SessionStatement } from '@/lib/auth/session';

let databasePromise: Promise<SessionDatabase> | null = null;

export function getLocalDatabase(): Promise<SessionDatabase> {
  if (!databasePromise) {
    databasePromise = Promise.resolve()
      .then(() => openLocalDatabase())
      .catch((error: unknown) => {
        databasePromise = null;
        throw error;
      });
  }
  return databasePromise;
}

function openLocalDatabase(): SessionDatabase {
  const file = findMigratedSqlite(path.join(process.cwd(), '.wrangler', 'state'));
  const sqlite = new DatabaseSync(file);
  sqlite.exec('PRAGMA foreign_keys = ON');
  sqlite.exec('PRAGMA busy_timeout = 5000');
  return asSessionDatabase(sqlite);
}

function findMigratedSqlite(dir: string): string {
  for (const file of findSqliteFiles(dir)) {
    const sqlite = new DatabaseSync(file);
    try {
      const row = sqlite
        .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 't_sessions'")
        .get();
      if (row) {
        return file;
      }
    } finally {
      sqlite.close();
    }
  }
  throw new Error('ローカル D1 がありません。pnpm d1:migrate:local を実行してください');
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
    } else if (entry.isFile() && entry.name.endsWith('.sqlite')) {
      found.push(fullPath);
    }
  }
  return found;
}

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
