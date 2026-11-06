import type { SessionDatabase, SessionSqlValue } from '@/lib/auth/session';

export async function queryAll(
  db: SessionDatabase,
  sql: string,
  params: readonly SessionSqlValue[] = [],
): Promise<unknown[]> {
  return db
    .prepare(sql)
    .bind(...params)
    .all();
}

export async function queryFirst(
  db: SessionDatabase,
  sql: string,
  params: readonly SessionSqlValue[] = [],
): Promise<unknown> {
  return db
    .prepare(sql)
    .bind(...params)
    .first();
}

export async function execute(
  db: SessionDatabase,
  sql: string,
  params: readonly SessionSqlValue[] = [],
): Promise<void> {
  await db
    .prepare(sql)
    .bind(...params)
    .run();
}

export function isUniqueViolation(error: unknown): boolean {
  const message = error instanceof Error ? error.message : '';
  return message.includes('UNIQUE') || message.includes('SQLITE_CONSTRAINT');
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function readId(value: unknown): number | null {
  if (typeof value === 'number' && Number.isSafeInteger(value) && value > 0) {
    return value;
  }
  if (typeof value === 'bigint' && value > BigInt(0) && value <= BigInt(Number.MAX_SAFE_INTEGER)) {
    return Number(value);
  }
  return null;
}

export function readRows(rows: unknown[]): Record<string, unknown>[] {
  return rows.filter(isRecord);
}

export function asBoolean(value: unknown): boolean | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (value === true || value === 1) {
    return true;
  }
  if (value === false || value === 0) {
    return false;
  }
  return null;
}

export function parseJson(value: unknown): unknown {
  if (typeof value !== 'string' || value.length === 0) {
    return null;
  }
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
}

export function toSqlBoolean(value: unknown): number | null {
  if (value === null || value === undefined) {
    return null;
  }
  return value ? 1 : 0;
}

export function toSqlJson(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  return JSON.stringify(value);
}

export function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}
