import { test, expect } from '@playwright/test';

test.describe('認証機能のE2Eテスト', () => {
  test('新規登録が成功する', async ({ page }) => {
    await page.goto('/register');

    // フォームに入力
    await page.fill('input[name="display_name"]', 'Test User');
    await page.fill('input[name="email"]', `test-${Date.now()}@example.com`);
    await page.fill('input[name="password"]', 'testpassword123');

    // 送信
    await page.click('button[type="submit"]');

    // 日記一覧ページにリダイレクトされることを確認
    await expect(page).toHaveURL(/\/diary/);
  });

  test('ログインが成功する', async ({ page }) => {
    // まず新規登録
    await page.goto('/register');
    const testEmail = `test-${Date.now()}@example.com`;
    await page.fill('input[name="display_name"]', 'Test User');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', 'testpassword123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/diary/, { timeout: 10000 });

    // ログアウト（アバターアイコンをクリックしてドロップダウンメニューを開く）
    // ヘッダー右側のアバターボタンを探す
    const avatarButton = page.locator('header').locator('button').last();
    await avatarButton.click();
    await page.waitForSelector('text=ログアウト', { timeout: 5000 });
    await page.click('text=ログアウト');
    await page.waitForURL(/\/login/, { timeout: 10000 });

    // ログイン
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', 'testpassword123');
    await page.click('button[type="submit"]');

    // 日記一覧ページにリダイレクトされることを確認
    await expect(page).toHaveURL(/\/diary/, { timeout: 10000 });
  });

  test('無効な認証情報でログインが失敗する', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[name="email"]', 'invalid@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // エラーメッセージが表示されることを確認
    await expect(
      page.locator('text=メールアドレスまたはパスワードが正しくありません'),
    ).toBeVisible();
  });
});
