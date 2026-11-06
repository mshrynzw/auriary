/**
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest';
import { normalizeEmail } from './email';

describe('normalizeEmail', () => {
  it('前後の空白を除いて小文字にする', () => {
    expect(normalizeEmail(' User@Example.COM ')).toBe('user@example.com');
  });
});
