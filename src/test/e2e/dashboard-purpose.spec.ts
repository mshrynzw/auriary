import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test, expect } from '@playwright/test';

const csvBase64 =
  'g4yDUoFbg2iL5pWqLI7miPiWvCyO5oi1k/qVdIFAlE4sjuaItZP6lXSBQIyOLI7miLWT+pV0gUCT+iyL4Ip6LJNFl3YKlr6N1yyOeJWlLDIwMjYsMTEsNiwyNzgsU0VWRU4tRUxFVkVOCg==';

function monthLabel(monthsAgo: number, windowMonths: number) {
  const end = new Date();
  end.setDate(1);
  const start = new Date(end.getFullYear(), end.getMonth() - (windowMonths - 1), 1);
  const date = new Date(end.getFullYear(), end.getMonth() - monthsAgo, 1);
  const month = `${date.getMonth() + 1}月`;
  return start.getFullYear() === end.getFullYear() ? month : `${date.getFullYear()}年${month}`;
}

test('ダッシュボードに用途の支出と割合が出て、期間を変えられる', async ({ page }) => {
  test.setTimeout(120000);
  const csvPath = path.join(os.tmpdir(), `auriary-dashboard-purpose-${Date.now()}.csv`);
  fs.writeFileSync(csvPath, Buffer.from(csvBase64, 'base64'));

  await page.goto('/register');
  await page.fill('input[name="display_name"]', '用途グラフ');
  await page.fill('input[name="email"]', `chart-${Date.now()}@example.com`);
  await page.fill('input[name="password"]', 'testpassword123');
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/diary/, { timeout: 30000 });

  await page.goto('/settings');
  await page.getByLabel('用途名').fill('食費');
  await page.getByRole('button', { name: '追加' }).click();
  await expect(page.getByLabel('食費の名前')).toBeVisible();

  await page.goto('/income-expense');
  await page.setInputFiles('input[name="csv"]', csvPath);
  await page.getByRole('button', { name: '取り込み' }).click();
  await expect(page.getByText('1件を取り込みました（期間は上書き）')).toBeVisible({
    timeout: 20000,
  });
  await page.getByRole('combobox', { name: '用途' }).click();
  await page.getByRole('option', { name: '食費' }).click();
  await expect(page.getByRole('combobox', { name: '用途' })).toHaveText('食費');
  await expect(page.locator('svg.text-emerald-600').first()).toBeVisible({ timeout: 15000 });

  await page.goto('/dashboard');
  const spending = page.getByRole('region', { name: '用途の支出' });
  const share = page.getByRole('region', { name: '用途の割合' });
  await expect(spending.getByRole('combobox', { name: '表示期間' })).toHaveText('過去3か月', {
    timeout: 20000,
  });
  const oldest = monthLabel(2, 3);
  await expect(spending.getByText(oldest, { exact: true })).toBeVisible();
  await expect(spending.getByText('食費').first()).toBeVisible();
  await expect(share.getByText('食費 100%')).toBeVisible();

  await spending.getByRole('combobox', { name: '表示期間' }).click();
  await page.getByRole('option', { name: '過去1か月' }).click();
  await expect(spending.getByText(oldest, { exact: true })).not.toBeVisible();
  await expect(spending.getByText(monthLabel(0, 1), { exact: true })).toBeVisible();
  await expect(share.getByText('食費 100%')).toBeVisible();
});
