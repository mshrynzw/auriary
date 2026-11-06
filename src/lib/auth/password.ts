/**
 * パスワードハッシュ。Workers の Web Crypto (PBKDF2-SHA-256)。
 * 保存形式: pbkdf2-sha256$<iterations>$<salt hex>$<hash hex>
 * 反復回数を変えると、既存のハッシュは検証できなくなる。
 */

export const PBKDF2_ITERATIONS = 100_000;

const PBKDF2_HASH = 'SHA-256';
const PBKDF2_SALT_BYTES = 16;
const PBKDF2_HASH_BITS = 256;
const PASSWORD_HASH_PREFIX = 'pbkdf2-sha256';

interface ParsedPasswordHash {
  salt: Uint8Array;
  hash: Uint8Array;
}

/**
 * パスワードをハッシュする。同じパスワードでも salt が毎回変わる。
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(PBKDF2_SALT_BYTES));
  const hash = await derivePasswordBits(password, salt);
  return `${PASSWORD_HASH_PREFIX}$${PBKDF2_ITERATIONS}$${bytesToHex(salt)}$${bytesToHex(hash)}`;
}

/**
 * 平文と保存済みハッシュを定数時間で比較する。形式が違う場合は不一致。
 */
export async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  const parsed = parsePasswordHash(passwordHash);
  if (!parsed) {
    return false;
  }

  const actual = await derivePasswordBits(password, parsed.salt);
  return timingSafeEqual(actual, parsed.hash);
}

async function derivePasswordBits(password: string, salt: Uint8Array): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      hash: PBKDF2_HASH,
      salt: copyBytes(salt),
      iterations: PBKDF2_ITERATIONS,
    },
    key,
    PBKDF2_HASH_BITS,
  );
  return new Uint8Array(bits);
}

function parsePasswordHash(stored: string): ParsedPasswordHash | null {
  const parts = stored.split('$');
  if (parts.length !== 4) {
    return null;
  }

  const [algorithm, iterationsText, saltHex, hashHex] = parts;
  if (algorithm !== PASSWORD_HASH_PREFIX || iterationsText !== String(PBKDF2_ITERATIONS)) {
    return null;
  }

  const salt = hexToBytes(saltHex ?? '');
  const hash = hexToBytes(hashHex ?? '');
  if (!salt || !hash || salt.length !== PBKDF2_SALT_BYTES || hash.length !== PBKDF2_HASH_BITS / 8) {
    return null;
  }

  return { salt, hash };
}

function timingSafeEqual(left: Uint8Array, right: Uint8Array): boolean {
  const length = Math.max(left.length, right.length);
  let diff = left.length ^ right.length;
  for (let index = 0; index < length; index += 1) {
    const leftByte = index < left.length ? left[index]! : 0;
    const rightByte = index < right.length ? right[index]! : 0;
    diff |= leftByte ^ rightByte;
  }
  return diff === 0;
}

function copyBytes(bytes: Uint8Array): Uint8Array<ArrayBuffer> {
  const copy = new Uint8Array(new ArrayBuffer(bytes.byteLength));
  copy.set(bytes);
  return copy;
}

function bytesToHex(bytes: Uint8Array): string {
  let hex = '';
  for (const byte of bytes) {
    hex += byte.toString(16).padStart(2, '0');
  }
  return hex;
}

function hexToBytes(hex: string): Uint8Array | null {
  if (hex.length % 2 !== 0 || !/^[0-9a-f]+$/.test(hex)) {
    return null;
  }

  const bytes = new Uint8Array(hex.length / 2);
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Number.parseInt(hex.slice(index * 2, index * 2 + 2), 16);
  }
  return bytes;
}
