/**
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest';
import { authRedirectTarget, requiresSession } from './routes';

describe('ルート保護', () => {
  it('カレンダー、分析、設定、血圧、日記の作成と編集はセッションが必要', () => {
    expect(requiresSession('/calendar')).toBe(true);
    expect(requiresSession('/analytics/mood')).toBe(true);
    expect(requiresSession('/settings')).toBe(true);
    expect(requiresSession('/blood-pressure')).toBe(true);
    expect(requiresSession('/diary/new')).toBe(true);
    expect(requiresSession('/diary/12/edit')).toBe(true);
  });

  it('日記一覧とダッシュボードは未認証でも開ける', () => {
    expect(requiresSession('/diary')).toBe(false);
    expect(requiresSession('/dashboard')).toBe(false);
    expect(requiresSession('/diary/12')).toBe(false);
  });

  it('未認証の保護ページはログインへ、認証済みのログイン画面は日記へ', () => {
    expect(authRedirectTarget('/settings', false)).toBe('/login');
    expect(authRedirectTarget('/diary', false)).toBeNull();
    expect(authRedirectTarget('/login', true)).toBe('/diary');
    expect(authRedirectTarget('/register', true)).toBe('/diary');
    expect(authRedirectTarget('/settings', true)).toBeNull();
  });
});
