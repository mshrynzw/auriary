import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test, expect } from '@playwright/test';

const csvBase64 =
  'g4yDUoFbg2iL5pWqLI7miPiWvCyO5oi1k/qVdIFAlE4sjuaItZP6lXSBQIyOLI7miLWT+pV0gUCT+iyL4Ip6LJNFl3YKlr6N1yyOeJWlLDIwMjYsMTEsNiwyNzgsU0VWRU4tRUxFVkVOCg==';

test.describe('収支の用途', () => {
  test('設定した用途を明細で選び、再取り込み後も残り、削除すると未設定に戻る', async ({ page }) => {
    test.setTimeout(120000);
    const csvPath = path.join(os.tmpdir(), `auriary-bank-purpose-${Date.now()}.csv`);
    fs.writeFileSync(csvPath, Buffer.from(csvBase64, 'base64'));

    const email = `purpose-${Date.now()}@example.com`;
    await page.goto('/register');
    await page.fill('input[name="display_name"]', '用途テスト');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="password"]', 'testpassword123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/diary/, { timeout: 30000 });

    await page.goto('/settings');
    await page.getByLabel('文字色').fill('#dc2626');
    await page.getByLabel('用途名').fill('食費');
    await page.getByRole('button', { name: '追加' }).click();
    await expect(page.getByLabel('食費の名前')).toBeVisible();

    await page.getByLabel('食費の文字色').fill('#16a34a');
    await page.getByLabel('食費の名前').click();
    await expect(page.locator('svg.text-emerald-600').first()).toBeVisible({ timeout: 15000 });
    await expect(page.getByLabel('食費の名前')).toHaveCSS('color', 'rgb(22, 163, 74)');

    await page.goto('/income-expense');
    await page.setInputFiles('input[name="csv"]', csvPath);
    await page.getByRole('button', { name: '取り込み' }).click();
    await expect(page.getByText('1件を取り込みました（期間は上書き）')).toBeVisible({
      timeout: 20000,
    });
    await expect(page.getByRole('columnheader', { name: '用途' })).toBeVisible();

    await page.getByRole('combobox', { name: '用途' }).click();
    await page.getByRole('option', { name: '食費' }).click();
    const purpose = page.getByRole('combobox', { name: '用途' });
    await expect(purpose).toHaveText('食費');
    await expect(purpose).toHaveCSS('color', 'rgb(22, 163, 74)');

    await page.reload();
    await expect(page.getByRole('combobox', { name: '用途' })).toHaveText('食費');

    const imported = page.getByText('1件を取り込みました（期間は上書き）');
    const importedCount = await imported.count();
    await page.setInputFiles('input[name="csv"]', csvPath);
    await page.getByRole('button', { name: '取り込み' }).click();
    await expect.poll(async () => imported.count(), { timeout: 20000 }).toBeGreaterThan(importedCount);
    await page.reload();
    await expect(page.getByRole('combobox', { name: '用途' })).toHaveText('食費');
    await expect(page.getByRole('combobox', { name: '用途' })).toHaveCSS('color', 'rgb(22, 163, 74)');

    await page.goto('/settings');
    await page.getByRole('button', { name: '食費を削除' }).click();
    await page.getByRole('alertdialog').getByRole('button', { name: '削除' }).click();
    await expect(page.getByText('用途を削除しました')).toBeVisible();

    await page.goto('/income-expense');
    await expect(page.getByRole('combobox', { name: '用途' })).toHaveText('未設定');
  });
});
