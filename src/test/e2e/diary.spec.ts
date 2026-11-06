import { test, expect } from '@playwright/test';

test.describe('日記機能のE2Eテスト', () => {
  let testEmail: string;

  test.beforeEach(async ({ page }) => {
    // テストユーザーでログイン
    testEmail = `test-${Date.now()}@example.com`;
    await page.goto('/register');
    await page.fill('input[name="display_name"]', 'Test User');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', 'testpassword123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/diary/);
  });

  test('日記を作成できる', async ({ page }) => {
    await page.goto('/diary/new');

    // 日記を入力
    await page.fill('input[name="journal_date"]', '2026-11-06');
    await page.fill('textarea[name="note"]', 'E2Eテスト用の日記');

    // 送信
    await page.click('button[type="submit"]');

    // 日記一覧ページにリダイレクトされることを確認
    await expect(page).toHaveURL(/\/diary/);

    // 作成した日記が表示されることを確認
    await expect(page.locator('text=2026年11月6日')).toBeVisible();
    await expect(page.locator('text=E2Eテスト用の日記')).toBeVisible();
  });

  test('日記を編集できる', async ({ page }) => {
    test.setTimeout(60000);
    // まず日記を作成
    await page.goto('/diary/new');
    await page.fill('input[name="journal_date"]', '2026-11-06');
    await page.fill('textarea[name="note"]', '編集前の日記');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/diary/, { timeout: 10000 });

    // 編集リンクをクリック（日記カード内の編集ボタン）
    const editLink = page
      .locator('div.cursor-pointer')
      .filter({ hasText: '編集前の日記' })
      .locator('a[href*="/edit"]');
    await editLink.click({ noWaitAfter: true });
    await page.waitForURL(/\/diary\/\d+\/edit/, { timeout: 30000 });

    // 日記を編集
    await page.waitForSelector('textarea[name="note"]');
    await page.fill('textarea[name="note"]', '編集後の日記');
    await page.click('button[type="submit"]');

    // 日記一覧ページにリダイレクトされることを確認
    await expect(page).toHaveURL(/\/diary/, { timeout: 10000 });

    // 編集した内容が表示されることを確認
    await expect(page.locator('text=編集後の日記')).toBeVisible({ timeout: 5000 });
  });

  test('日記を削除できる', async ({ page }) => {
    // まず日記を作成
    await page.goto('/diary/new');
    await page.fill('input[name="journal_date"]', '2026-11-06');
    await page.fill('textarea[name="note"]', '削除用の日記');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/diary/, { timeout: 10000 });

    // 削除ボタンをクリック（ゴミ箱アイコン - 日記カード内）
    // 日記カード内の最後のボタン（削除ボタン）をクリック
    const diaryCard = page.locator('div.cursor-pointer').filter({ hasText: '削除用の日記' });
    const deleteButton = diaryCard.locator('button').last();
    await deleteButton.click();

    // 確認ダイアログで削除を確認
    await page.waitForSelector('text=日記を削除しますか？', { timeout: 5000 });
    await page.click('button:has-text("削除"):not(:has-text("キャンセル"))');

    // 日記が削除されることを確認（トースト通知または日記の非表示）
    await expect(page.getByText('日記を削除しました')).toBeVisible();
    await expect(page.locator('div.cursor-pointer').filter({ hasText: '削除用の日記' })).toHaveCount(
      0,
      { timeout: 15000 },
    );
  });
});
