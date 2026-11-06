/**
 * メールとパスワードの登録・照合。セッション Cookie は扱わない。
 */

import { normalizeEmail } from './email';
import { hashPassword, verifyPassword } from './password';
import type { SessionDatabase } from './session';

export interface SessionUser {
  id: number;
  email: string;
  display_name: string;
}

export type AccountResult = { ok: true; user: SessionUser } | { ok: false; message: string };

const INVALID_CREDENTIALS = 'メールアドレスまたはパスワードが正しくありません';
const EMAIL_TAKEN = 'このメールアドレスは既に登録されています';

const DUMMY_PASSWORD_HASH = 'pbkdf2-sha256$100000$' + '00'.repeat(16) + '$' + '11'.repeat(32);

const SELECT_USER_BY_EMAIL_SQL =
  'SELECT id, email, display_name, password_hash, is_active, deleted_at FROM m_users WHERE email = ?';

const SELECT_USER_BY_ID_SQL =
  'SELECT id, email, display_name, is_active, deleted_at FROM m_users WHERE id = ?';

const INSERT_USER_SQL =
  'INSERT INTO m_users (display_name, email, password_hash, is_active, created_at, updated_at) VALUES (?, ?, ?, 1, ?, ?)';

const UPDATE_USER_ACTOR_SQL = 'UPDATE m_users SET created_by = ?, updated_by = ? WHERE id = ?';

export async function registerAccount(
  db: SessionDatabase,
  input: { email: string; password: string; displayName: string },
  now: Date = new Date(),
): Promise<AccountResult> {
  const email = normalizeEmail(input.email);
  const displayName = input.displayName.trim();
  if (displayName.length === 0) {
    return { ok: false, message: '表示名を入力してください' };
  }

  const existing = await db.prepare(SELECT_USER_BY_EMAIL_SQL).bind(email).first();
  if (existing) {
    return { ok: false, message: EMAIL_TAKEN };
  }

  const passwordHash = await hashPassword(input.password);
  const timestamp = now.toISOString();
  try {
    await db
      .prepare(INSERT_USER_SQL)
      .bind(displayName, email, passwordHash, timestamp, timestamp)
      .run();
  } catch (error) {
    if (isUniqueViolation(error)) {
      return { ok: false, message: EMAIL_TAKEN };
    }
    throw error;
  }

  const created = readUser(await db.prepare(SELECT_USER_BY_EMAIL_SQL).bind(email).first());
  if (!created) {
    return { ok: false, message: '登録に失敗しました' };
  }

  await db.prepare(UPDATE_USER_ACTOR_SQL).bind(created.id, created.id, created.id).run();
  return { ok: true, user: created.publicUser };
}

export async function authenticateAccount(
  db: SessionDatabase,
  input: { email: string; password: string },
): Promise<AccountResult> {
  const email = normalizeEmail(input.email);
  const row = readUser(await db.prepare(SELECT_USER_BY_EMAIL_SQL).bind(email).first());
  const passwordHash = row?.passwordHash ?? DUMMY_PASSWORD_HASH;
  const passwordMatches = await verifyPassword(input.password, passwordHash);

  if (!row || !passwordMatches || !row.isActive || row.deletedAt) {
    return { ok: false, message: INVALID_CREDENTIALS };
  }

  return { ok: true, user: row.publicUser };
}

export async function findActiveUserById(
  db: SessionDatabase,
  userId: number,
): Promise<SessionUser | null> {
  const row = readUser(await db.prepare(SELECT_USER_BY_ID_SQL).bind(userId).first());
  if (!row || !row.isActive || row.deletedAt) {
    return null;
  }
  return row.publicUser;
}

interface StoredUser {
  id: number;
  passwordHash: string;
  isActive: boolean;
  deletedAt: string | null;
  publicUser: SessionUser;
}

function readUser(row: unknown): StoredUser | null {
  if (typeof row !== 'object' || row === null || Array.isArray(row)) {
    return null;
  }

  const id = readId(Reflect.get(row, 'id'));
  const email = Reflect.get(row, 'email');
  const displayName = Reflect.get(row, 'display_name');
  const passwordHash = Reflect.get(row, 'password_hash');
  const isActive = Reflect.get(row, 'is_active');
  const deletedAt = Reflect.get(row, 'deleted_at');

  if (id === null || typeof email !== 'string' || typeof displayName !== 'string') {
    return null;
  }

  return {
    id,
    passwordHash: typeof passwordHash === 'string' ? passwordHash : '',
    isActive: isActive === 1 || isActive === true,
    deletedAt: typeof deletedAt === 'string' && deletedAt.length > 0 ? deletedAt : null,
    publicUser: { id, email, display_name: displayName },
  };
}

function readId(value: unknown): number | null {
  if (typeof value === 'number' && Number.isSafeInteger(value) && value > 0) {
    return value;
  }
  if (typeof value === 'bigint' && value > BigInt(0) && value <= BigInt(Number.MAX_SAFE_INTEGER)) {
    return Number(value);
  }
  return null;
}

function isUniqueViolation(error: unknown): boolean {
  const message = error instanceof Error ? error.message : '';
  return message.includes('UNIQUE') || message.includes('SQLITE_CONSTRAINT');
}
