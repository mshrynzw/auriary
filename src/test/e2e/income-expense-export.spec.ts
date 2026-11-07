import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test, expect } from '@playwright/test';

const csvBase64 =
  'g4yDUoFbg2iL5pWqLI7miPiWvCyO5oi1k/qVdIFAlE4sjuaItZP6lXSBQIyOLI7miLWT+pV0gUCT+iyL4Ip6LJNFl3YKlr6N1yyOeJWlLDIwMjYsMTEsNiwyNzgsU0VWRU4tRUxFVkVOCg==';

test('明細一覧を CSV に書き出せる', async ({ page }) => {
  test.setTimeout(120000);
  const csvPath = path.join(os.tmpdir(), `auriary-export-source-${Date.now()}.csv`);
  fs.writeFileSync(csvPath, Buffer.from(csvBase64, 'base64'));

  await page.goto('/register');
  await page.locator('input[name="display_name"]').waitFor({ state: 'visible', timeout: 30000 });
  await page.fill('input[name="display_name"]', '書き出し');
  await page.fill('input[name="email"]', `export-${Date.now()}@example.com`);
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
  await expect(page.locator('svg.text-emerald-600').first()).toBeVisible({ timeout: 15000 });

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'CSV書き出し' }).click();
  const download = await downloadPromise;
  const exportedPath = await download.path();
  expect(exportedPath).toBeTruthy();
  const exported = fs.readFileSync(exportedPath ?? '', 'utf8');
  expect(exported.charCodeAt(0)).toBe(0xfeff);
  expect(exported).toContain('日付,取引名,金額,摘要,用途,メモ');
  expect(exported).toContain('2026/11/06,支払,278,SEVEN-ELEVEN,食費,');
});
