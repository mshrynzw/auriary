import { describe, it, expect } from 'vitest';
import { loginFormSchema, registerFormSchema } from '@/schemas';

describe('loginSchema', () => {
  it('有効なログインデータを検証する', () => {
    const data = {
      email: 'test@example.com',
      password: 'password123',
    };
    expect(loginFormSchema.parse(data)).toEqual(data);
  });

  it('無効なメールアドレスを拒否する', () => {
    const data = {
      email: 'invalid-email',
      password: 'password123',
    };
    expect(() => loginFormSchema.parse(data)).toThrow();
  });

  it('パスワードが6文字未満の場合にエラーを投げる', () => {
    const data = {
      email: 'test@example.com',
      password: '12345', // 6文字未満
    };
    expect(() => loginFormSchema.parse(data)).toThrow();
  });
});

describe('registerSchema', () => {
  it('有効な登録データを検証する', () => {
    const data = {
      email: 'test@example.com',
      password: 'password123',
      display_name: 'Test User',
    };
    expect(registerFormSchema.parse(data)).toEqual(data);
  });

  it('display_name が空の場合にエラーを投げる', () => {
    const data = {
      email: 'test@example.com',
      password: 'password123',
      display_name: '',
    };
    expect(() => registerFormSchema.parse(data)).toThrow();
  });

  it('display_name が50文字を超える場合にエラーを投げる', () => {
    const data = {
      email: 'test@example.com',
      password: 'password123',
      display_name: 'a'.repeat(51),
    };
    expect(() => registerFormSchema.parse(data)).toThrow();
  });
});
