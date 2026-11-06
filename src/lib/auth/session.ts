/**
 * セッションの発行と検証。
 * Cookie へ載せるのは平文トークンだけ。D1 には SHA-256 だけを保存する。
 * Secure は本番だけ付ける。localhost の HTTP では Secure Cookie が保存されない。
 */

export const SESSION_TOKEN_BYTES = 32;

/** ログインが cookies().set に渡す値。名前、HttpOnly、Secure、SameSite=Lax、Path、Max-Age。 */
export const SESSION_COOKIE = {
  name: 'auriary_session',
  httpOnly: true,
  secure: true,
  sameSite: 'lax',
  path: '/',
  maxAge: 60 * 60 * 24 * 30,
} as const;

const TOKEN_HASH_PATTERN = /^[0-9a-f]{64}$/;
const ISO_TIMESTAMP_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
const MAX_PRESENTED_TOKEN_LENGTH = 512;

export const INSERT_SESSION_SQL =
  'INSERT INTO t_sessions (user_id, token_hash, expires_at) VALUES (?, ?, ?)';

export const SELECT_ACTIVE_SESSION_SQL =
  'SELECT user_id FROM t_sessions WHERE token_hash = ? AND revoked_at IS NULL AND expires_at > ? LIMIT 1';

export const REVOKE_SESSION_SQL =
  'UPDATE t_sessions SET revoked_at = ? WHERE token_hash = ? AND revoked_at IS NULL';

export type SessionSqlValue = string | number | null;

/** D1 の prepare().bind().run()/first() に合わせた最小インターフェース。 */
export interface SessionStatement {
  bind(...values: readonly SessionSqlValue[]): SessionStatement;
  run(): Promise<SessionRunResult>;
  first(): Promise<unknown>;
  all(): Promise<unknown[]>;
}

export interface SessionRunResult {
  success: boolean;
}

export interface SessionDatabase {
  prepare(query: string): SessionStatement;
}

export interface SessionRecord {
  userId: number;
  tokenHash: string;
  expiresAt: string;
}

export interface SessionCredential extends SessionRecord {
  token: string;
}

/**
 * Cookie の Max-Age と同じ期限。検証の基準時刻はアプリが渡す。
 */
export function sessionExpiresAt(now: Date = new Date()): Date {
  return new Date(now.getTime() + SESSION_COOKIE.maxAge * 1000);
}

/**
 * cookies().set に渡す属性。本番だけ Secure。
 */
export function sessionCookieAttributes(nodeEnv: string | undefined = process.env.NODE_ENV) {
  return {
    httpOnly: SESSION_COOKIE.httpOnly,
    secure: nodeEnv === 'production',
    sameSite: SESSION_COOKIE.sameSite,
    path: SESSION_COOKIE.path,
    maxAge: SESSION_COOKIE.maxAge,
  };
}

/**
 * 平文トークンを発行して保存し、Cookie に載せる文字列を返す。
 */
export async function issueSession(
  db: SessionDatabase,
  userId: number,
  now: Date = new Date(),
): Promise<string> {
  const credential = await createSessionCredential(userId, sessionExpiresAt(now));
  await saveSession(db, credential);
  return credential.token;
}

/**
 * 提示された平文トークンのセッションを失効させる。該当が無くても成功する。
 */
export async function revokeSession(
  db: SessionDatabase,
  token: string,
  now: Date = new Date(),
): Promise<void> {
  if (token.length === 0 || token.length > MAX_PRESENTED_TOKEN_LENGTH) {
    return;
  }
  if (!(now instanceof Date) || Number.isNaN(now.getTime())) {
    throw new Error('検証時刻が不正です');
  }

  const tokenHash = await hashSessionToken(token);
  await db.prepare(REVOKE_SESSION_SQL).bind(now.toISOString(), tokenHash).run();
}

/**
 * 平文トークンと、D1 に保存する SHA-256 hex を返す。永続化はしない。
 */
export async function createSessionCredential(
  userId: number,
  expiresAt: Date,
): Promise<SessionCredential> {
  assertUserId(userId);
  if (!(expiresAt instanceof Date) || Number.isNaN(expiresAt.getTime())) {
    throw new Error('セッションの有効期限が不正です');
  }

  const expiresAtIso = expiresAt.toISOString();
  if (!ISO_TIMESTAMP_PATTERN.test(expiresAtIso)) {
    throw new Error('セッションの有効期限が不正です');
  }

  const token = bytesToBase64Url(crypto.getRandomValues(new Uint8Array(SESSION_TOKEN_BYTES)));
  const tokenHash = await hashSessionToken(token);
  return {
    token,
    tokenHash,
    userId,
    expiresAt: expiresAtIso,
  };
}

/**
 * 保存用ハッシュだけを t_sessions に入れる。
 */
export async function saveSession(db: SessionDatabase, record: SessionRecord): Promise<void> {
  assertUserId(record.userId);
  if (!TOKEN_HASH_PATTERN.test(record.tokenHash)) {
    throw new Error('セッションハッシュの形式が不正です');
  }
  if (!ISO_TIMESTAMP_PATTERN.test(record.expiresAt)) {
    throw new Error('セッションの有効期限が不正です');
  }

  await db
    .prepare(INSERT_SESSION_SQL)
    .bind(record.userId, record.tokenHash, record.expiresAt)
    .run();
}

/**
 * 提示された平文トークンをハッシュし、未失効かつ期限内なら user_id を返す。
 * 該当がなければ null。
 */
export async function verifySession(
  db: SessionDatabase,
  token: string,
  now: Date = new Date(),
): Promise<number | null> {
  if (token.length === 0 || token.length > MAX_PRESENTED_TOKEN_LENGTH) {
    return null;
  }
  if (!(now instanceof Date) || Number.isNaN(now.getTime())) {
    throw new Error('検証時刻が不正です');
  }

  const tokenHash = await hashSessionToken(token);
  const row = await db
    .prepare(SELECT_ACTIVE_SESSION_SQL)
    .bind(tokenHash, now.toISOString())
    .first();
  return readUserId(row);
}

async function hashSessionToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  return bytesToHex(new Uint8Array(digest));
}

function assertUserId(userId: number): void {
  if (!Number.isSafeInteger(userId) || userId <= 0) {
    throw new Error('ユーザー ID が不正です');
  }
}

function readUserId(row: unknown): number | null {
  if (typeof row !== 'object' || row === null || Array.isArray(row)) {
    return null;
  }

  const userId = Reflect.get(row, 'user_id');
  if (typeof userId === 'number' && Number.isSafeInteger(userId) && userId > 0) {
    return userId;
  }
  if (
    typeof userId === 'bigint' &&
    userId > BigInt(0) &&
    userId <= BigInt(Number.MAX_SAFE_INTEGER)
  ) {
    return Number(userId);
  }
  return null;
}

function bytesToHex(bytes: Uint8Array): string {
  let hex = '';
  for (const byte of bytes) {
    hex += byte.toString(16).padStart(2, '0');
  }
  return hex;
}

function bytesToBase64Url(bytes: Uint8Array): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  let result = '';
  for (let index = 0; index < bytes.length; index += 3) {
    const first = bytes[index]!;
    const second = index + 1 < bytes.length ? bytes[index + 1]! : 0;
    const third = index + 2 < bytes.length ? bytes[index + 2]! : 0;
    const chunk = (first << 16) | (second << 8) | third;
    result += alphabet[(chunk >> 18) & 63];
    result += alphabet[(chunk >> 12) & 63];
    if (index + 1 < bytes.length) {
      result += alphabet[(chunk >> 6) & 63];
    }
    if (index + 2 < bytes.length) {
      result += alphabet[chunk & 63];
    }
  }
  return result;
}
