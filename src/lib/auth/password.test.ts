/**
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest';
import { PBKDF2_ITERATIONS, hashPassword, verifyPassword } from './password';

describe('hashPassword', () => {
  it('同じパスワードは一致し、違うパスワードは一致しない', async () => {
    const stored = await hashPassword('password123');

    expect(await verifyPassword('password123', stored)).toBe(true);
    expect(await verifyPassword('password124', stored)).toBe(false);
    expect(await verifyPassword('', stored)).toBe(false);
    expect(stored.includes('password123')).toBe(false);
  });

  it('毎回違う salt を使う', async () => {
    const first = await hashPassword('password123');
    const second = await hashPassword('password123');

    expect(first).not.toBe(second);
    expect(saltOf(first)).not.toBe(saltOf(second));
    expect(saltOf(first).length).toBe(32);
    expect(await verifyPassword('password123', first)).toBe(true);
    expect(await verifyPassword('password123', second)).toBe(true);
  });

  it('PBKDF2-SHA-256 で 100000 回以上反復する', async () => {
    expect(PBKDF2_ITERATIONS).toBeGreaterThanOrEqual(100_000);

    const stored = await hashPassword('password');
    const parts = stored.split('$');
    expect(parts[0]).toBe('pbkdf2-sha256');
    expect(parts[1]).toBe(String(PBKDF2_ITERATIONS));

    const salt = copyToArrayBuffer(hexToBytes(parts[2] ?? ''));
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode('password'),
      'PBKDF2',
      false,
      ['deriveBits'],
    );
    const bits = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        hash: 'SHA-256',
        salt,
        iterations: PBKDF2_ITERATIONS,
      },
      key,
      256,
    );

    expect(bytesToHex(new Uint8Array(bits))).toBe(parts[3]);
  });

  it('形式が違うハッシュは不一致になる', async () => {
    const stored = await hashPassword('password123');
    expect(await verifyPassword('password123', 'not-a-hash')).toBe(false);
    expect(await verifyPassword('password123', stored.slice(0, -1))).toBe(false);
    expect(await verifyPassword('password123', stored.replace('100000', '1'))).toBe(false);
  });
});

function saltOf(stored: string): string {
  return stored.split('$')[2] ?? '';
}

function copyToArrayBuffer(bytes: Uint8Array): Uint8Array<ArrayBuffer> {
  const copy = new Uint8Array(new ArrayBuffer(bytes.byteLength));
  copy.set(bytes);
  return copy;
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Number.parseInt(hex.slice(index * 2, index * 2 + 2), 16);
  }
  return bytes;
}

function bytesToHex(bytes: Uint8Array): string {
  return [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}
