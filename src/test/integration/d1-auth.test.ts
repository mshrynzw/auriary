/**
 * @vitest-environment node
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { authenticateAccount, findActiveUserById, registerAccount } from '@/lib/auth/accounts';
import {
  issueSession,
  revokeSession,
  verifySession,
  type SessionDatabase,
  type SessionSqlValue,
  type SessionStatement,
} from '@/lib/auth/session';

const schemaPath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../../migrations/0001_initial_schema.sql',
);

describe('D1 の登録とログイン', () => {
  let sqlite: DatabaseSync;

  beforeAll(() => {
    sqlite = new DatabaseSync(':memory:');
    sqlite.exec('PRAGMA foreign_keys = ON');
    sqlite.exec(fs.readFileSync(schemaPath, 'utf8'));
  });

  afterAll(() => {
    sqlite.close();
  });

  it('登録するとパスワードは平文のまま保存されず、本人だけがログインできる', async () => {
    const db = asSessionDatabase(sqlite);
    const password = 'testpassword123';
    const registered = await registerAccount(db, {
      email: ' New.User@Example.com ',
      password,
      displayName: ' 表示名 ',
    });

    expect(registered.ok).toBe(true);
    if (!registered.ok) {
      return;
    }
    expect(registered.user.email).toBe('new.user@example.com');
    expect(registered.user.display_name).toBe('表示名');

    const stored = sqlite
      .prepare('SELECT password_hash, created_by FROM m_users WHERE id = ?')
      .get(registered.user.id);
    expect(isRecord(stored)).toBe(true);
    if (!isRecord(stored)) {
      return;
    }
    expect(stored.password_hash).not.toBe(password);
    expect(String(stored.password_hash)).toContain('pbkdf2-sha256$');
    expect(Number(stored.created_by)).toBe(registered.user.id);

    const loggedIn = await authenticateAccount(db, {
      email: 'new.user@example.com',
      password,
    });
    expect(loggedIn).toEqual({ ok: true, user: registered.user });

    const wrongPassword = await authenticateAccount(db, {
      email: 'new.user@example.com',
      password: 'wrongpassword',
    });
    expect(wrongPassword).toEqual({
      ok: false,
      message: 'メールアドレスまたはパスワードが正しくありません',
    });

    const missing = await authenticateAccount(db, {
      email: 'missing@example.com',
      password,
    });
    expect(missing.ok).toBe(false);

    const duplicate = await registerAccount(db, {
      email: 'new.user@example.com',
      password,
      displayName: '別の人',
    });
    expect(duplicate).toEqual({
      ok: false,
      message: 'このメールアドレスは既に登録されています',
    });
  });

  it('失効したセッションと、停止したユーザーは認証されない', async () => {
    const db = asSessionDatabase(sqlite);
    const registered = await registerAccount(db, {
      email: 'session-user@example.com',
      password: 'testpassword123',
      displayName: 'セッション',
    });
    expect(registered.ok).toBe(true);
    if (!registered.ok) {
      return;
    }

    const now = new Date('2026-11-06T00:00:00.000Z');
    const token = await issueSession(db, registered.user.id, now);
    expect(await verifySession(db, token, now)).toBe(registered.user.id);
    expect(await findActiveUserById(db, registered.user.id)).toEqual(registered.user);

    await revokeSession(db, token, now);
    expect(await verifySession(db, token, now)).toBeNull();

    const stored = sqlite
      .prepare('SELECT token_hash, revoked_at FROM t_sessions WHERE user_id = ?')
      .all(registered.user.id);
    expect(Array.isArray(stored)).toBe(true);
    if (!Array.isArray(stored) || !isRecord(stored[0])) {
      return;
    }
    expect(stored[0].token_hash).not.toBe(token);
    expect(stored[0].revoked_at).toBe(now.toISOString());

    sqlite.prepare('UPDATE m_users SET is_active = 0 WHERE id = ?').run(registered.user.id);
    const inactive = await authenticateAccount(db, {
      email: 'session-user@example.com',
      password: 'testpassword123',
    });
    expect(inactive.ok).toBe(false);
    expect(await findActiveUserById(db, registered.user.id)).toBeNull();
  });

  it('別ユーザーのセッションを自分の user_id として返さない', async () => {
    const db = asSessionDatabase(sqlite);
    const now = new Date('2026-11-06T00:00:00.000Z');
    const userA = await registerAccount(db, {
      email: 'owner-a@example.com',
      password: 'testpassword123',
      displayName: 'A',
    });
    const userB = await registerAccount(db, {
      email: 'owner-b@example.com',
      password: 'testpassword123',
      displayName: 'B',
    });
    expect(userA.ok && userB.ok).toBe(true);
    if (!userA.ok || !userB.ok) {
      return;
    }

    const tokenA = await issueSession(db, userA.user.id, now);
    const tokenB = await issueSession(db, userB.user.id, now);
    expect(await verifySession(db, tokenA, now)).toBe(userA.user.id);
    expect(await verifySession(db, tokenB, now)).toBe(userB.user.id);
    expect(await verifySession(db, tokenA, now)).not.toBe(userB.user.id);
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
