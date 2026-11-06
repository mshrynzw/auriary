/**
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest';
import {
  INSERT_SESSION_SQL,
  REVOKE_SESSION_SQL,
  SELECT_ACTIVE_SESSION_SQL,
  SESSION_COOKIE,
  SESSION_TOKEN_BYTES,
  createSessionCredential,
  issueSession,
  revokeSession,
  saveSession,
  sessionCookieAttributes,
  sessionExpiresAt,
  verifySession,
  type SessionDatabase,
  type SessionSqlValue,
  type SessionStatement,
} from './session';

describe('セッション', () => {
  it('平文トークンと保存用ハッシュは一致しない', async () => {
    const expiresAt = new Date('2026-12-06T00:00:00.000Z');
    const credential = await createSessionCredential(7, expiresAt);

    expect(SESSION_TOKEN_BYTES).toBeGreaterThanOrEqual(32);
    expect(credential.token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(credential.tokenHash).toMatch(/^[0-9a-f]{64}$/);
    expect(credential.tokenHash).not.toBe(credential.token);
    expect(credential.tokenHash).toBe(await sha256Hex(credential.token));
    expect(credential.userId).toBe(7);
    expect(credential.expiresAt).toBe('2026-12-06T00:00:00.000Z');
  });

  it('期限内のセッションは user_id を返し、他ユーザーとは取り違えない', async () => {
    const db = new MemorySessionDatabase();
    const now = new Date('2026-11-06T00:00:00.000Z');
    const expiresAt = sessionExpiresAt(now);
    const userA = await createSessionCredential(1, expiresAt);
    const userB = await createSessionCredential(2, expiresAt);

    await saveSession(db, userA);
    await saveSession(db, userB);

    expect(db.inserts.map((row) => row.tokenHash)).toEqual([userA.tokenHash, userB.tokenHash]);
    expect(db.inserts.some((row) => row.tokenHash === userA.token)).toBe(false);
    expect(await verifySession(db, userA.token, now)).toBe(1);
    expect(await verifySession(db, userB.token, now)).toBe(2);
    expect(db.lookups.every((lookup) => lookup.tokenHash !== userA.token)).toBe(true);
    expect(db.lookups[0]?.tokenHash).toBe(await sha256Hex(userA.token));
  });

  it('期限切れ、失効済み、未知のトークンは未認証', async () => {
    const db = new MemorySessionDatabase();
    const now = new Date('2026-11-06T00:00:00.000Z');
    const expired = await createSessionCredential(1, new Date('2026-11-05T00:00:00.000Z'));
    const revoked = await createSessionCredential(1, sessionExpiresAt(now));
    const boundary = await createSessionCredential(1, now);

    await saveSession(db, expired);
    await saveSession(db, revoked);
    await saveSession(db, boundary);
    db.revoke(revoked.tokenHash);

    expect(await verifySession(db, expired.token, now)).toBeNull();
    expect(await verifySession(db, revoked.token, now)).toBeNull();
    expect(await verifySession(db, boundary.token, now)).toBeNull();
    expect(await verifySession(db, 'not-a-session-token', now)).toBeNull();
    expect(await verifySession(db, '', now)).toBeNull();
  });

  it('平文トークンはセッションハッシュとして保存できない', async () => {
    const db = new MemorySessionDatabase();
    const credential = await createSessionCredential(1, sessionExpiresAt());

    await expect(
      saveSession(db, {
        userId: credential.userId,
        tokenHash: credential.token,
        expiresAt: credential.expiresAt,
      }),
    ).rejects.toThrow('セッションハッシュの形式が不正です');
    expect(db.inserts).toHaveLength(0);
  });

  it('Cookie 属性を一箇所で定義する', () => {
    expect(SESSION_COOKIE).toEqual({
      name: 'auriary_session',
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    });
    expect(sessionCookieAttributes('production').secure).toBe(true);
    expect(sessionCookieAttributes('development').secure).toBe(false);
    expect(sessionExpiresAt(new Date('2026-11-06T00:00:00.000Z')).toISOString()).toBe(
      '2026-12-06T00:00:00.000Z',
    );
  });

  it('発行したセッションは検証でき、失効すると未認証になる', async () => {
    const db = new MemorySessionDatabase();
    const now = new Date('2026-11-06T00:00:00.000Z');
    const token = await issueSession(db, 4, now);

    expect(await verifySession(db, token, now)).toBe(4);
    await revokeSession(db, token, now);
    expect(await verifySession(db, token, now)).toBeNull();
    expect(db.revocations).toHaveLength(1);
    expect(db.revocations[0]).not.toBe(token);
  });
});

class MemorySessionDatabase implements SessionDatabase {
  readonly inserts: Array<{ userId: number; tokenHash: string; expiresAt: string }> = [];
  readonly lookups: Array<{ tokenHash: string; nowIso: string }> = [];
  readonly revocations: string[] = [];
  private readonly revoked = new Set<string>();

  prepare(query: string): SessionStatement {
    let values: SessionSqlValue[] = [];
    const statement: SessionStatement = {
      bind: (...bound) => {
        values = [...bound];
        return statement;
      },
      run: async () => {
        if (query === REVOKE_SESSION_SQL) {
          const [revokedAt, tokenHash] = values;
          if (typeof revokedAt !== 'string' || typeof tokenHash !== 'string') {
            throw new Error('バインド値の型が不正です');
          }
          this.revocations.push(tokenHash);
          this.revoked.add(tokenHash);
          return { success: true };
        }
        if (query !== INSERT_SESSION_SQL) {
          throw new Error('想定外の SQL です');
        }
        const [userId, tokenHash, expiresAt] = values;
        if (
          typeof userId !== 'number' ||
          typeof tokenHash !== 'string' ||
          typeof expiresAt !== 'string'
        ) {
          throw new Error('バインド値の型が不正です');
        }
        this.inserts.push({ userId, tokenHash, expiresAt });
        return { success: true };
      },
      all: async () => [],
      first: async () => {
        if (query !== SELECT_ACTIVE_SESSION_SQL) {
          throw new Error('想定外の SQL です');
        }
        const [tokenHash, nowIso] = values;
        if (typeof tokenHash !== 'string' || typeof nowIso !== 'string') {
          throw new Error('バインド値の型が不正です');
        }
        this.lookups.push({ tokenHash, nowIso });
        const row = this.inserts.find(
          (candidate) =>
            candidate.tokenHash === tokenHash &&
            !this.revoked.has(candidate.tokenHash) &&
            candidate.expiresAt > nowIso,
        );
        return row ? { user_id: row.userId } : null;
      },
    };
    return statement;
  }

  revoke(tokenHash: string): void {
    this.revoked.add(tokenHash);
  }
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}
