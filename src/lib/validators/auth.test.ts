import { describe, it, expect } from 'vitest';
import { loginSchema, registerSchema } from './auth';

describe('loginSchema', () => {
  it('有効なログインデータを検証する', () => {
    const data = {
      email: 'test@example.com',
      password: 'password123',
    };
    expect(loginSchema.parse(data)).toEqual(data);
  });

  it('無効なメールアドレスを拒否する', () => {
    const data = {
      email: 'invalid-email',
      password: 'password123',
    };
    expect(() => loginSchema.parse(data)).toThrow();
  });

  it('パスワードが6文字未満の場合にエラーを投げる', () => {
    const data = {
      email: 'test@example.com',
      password: '12345', // 6文字未満
    };
    expect(() => loginSchema.parse(data)).toThrow();
  });
});

describe('registerSchema', () => {
  it('有効な登録データを検証する', () => {
    const data = {
      email: 'test@example.com',
      password: 'password123',
      display_name: 'Test User',
    };
    expect(registerSchema.parse(data)).toEqual(data);
  });

  it('display_name が空の場合にエラーを投げる', () => {
    const data = {
      email: 'test@example.com',
      password: 'password123',
      display_name: '',
    };
    expect(() => registerSchema.parse(data)).toThrow();
  });

  it('display_name が50文字を超える場合にエラーを投げる', () => {
    const data = {
      email: 'test@example.com',
      password: 'password123',
      display_name: 'a'.repeat(51),
    };
    expect(() => registerSchema.parse(data)).toThrow();
  });
});

