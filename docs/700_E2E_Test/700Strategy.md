# E2Eテスト戦略

## 1. 目的

E2Eテストは、**ユーザーが実際に使用する機能をブラウザ上で検証**するテストです。auriary プロジェクトでは、E2Eテストを**最重要のテスト階層**として位置づけ、ユーザー体験の品質を保証します。

### 1.1 E2Eテストの役割

- **ユーザーフローの検証**: ログインから日記作成、編集、削除までの一連の流れ
- **UI/UX の検証**: 画面遷移、フォーム入力、エラーメッセージ表示
- **ブラウザ互換性の検証**: Chrome、Firefox、Safari での動作確認
- **レスポンシブデザインの検証**: モバイル・タブレット・デスクトップでの表示
- **パフォーマンスの検証**: ページ読み込み時間、操作の応答性

---

## 2. auriary における E2Eテストの重要性

### 2.1 なぜ E2Eテストが最重要か

auriary プロジェクトでは、以下の理由から **E2Eテストを最重要** としています：

1. **ユーザー体験の直接的な検証**: 実際のブラウザ環境で動作を確認
2. **Next.js 16 の複雑な機能**: Server Components、Server Actions、Cache Components の統合的な動作確認
3. **Supabase 認証フロー**: 認証状態に応じた画面遷移の検証
4. **AI 機能の統合**: OpenAI API との連携の動作確認
5. **PWA 機能（将来実装）**: Service Worker、オフライン機能の検証

### 2.2 テストピラミッドにおける位置づけ

```
        /\
       /  \
      / E2E \          ← 最重要（ユーザー体験の保証）
     /--------\
    /          \
   / Integration \    ← 重要（API・DB連携の保証）
  /--------------\
 /                \
/   Unit Test      \  ← 基礎（ロジックの保証）
/------------------\
```

---

## 3. Playwright ルール

### 3.1 Playwright の採用理由

- **高速**: 並列実行による高速なテスト実行
- **信頼性**: 自動リトライ、待機戦略による安定したテスト
- **クロスブラウザ**: Chrome、Firefox、Safari、Edge のサポート
- **モバイルエミュレーション**: モバイルデバイスのシミュレーション
- **デバッグ機能**: トレース、スクリーンショット、動画録画

### 3.2 基本設定

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

---

## 4. セレクター戦略

### 4.1 推奨セレクター

E2Eテストでは、以下の優先順位でセレクターを選択します：

1. **data-testid**: 最も推奨（安定性が高い）
2. **role + name**: アクセシビリティを考慮
3. **text**: ユーザーが実際に見るテキスト
4. **CSS セレクター**: 最後の手段

### 4.2 セレクターの例

```typescript
// ✅ Good: data-testid を使用
await page.getByTestId('diary-create-button').click();

// ✅ Good: role + name を使用
await page.getByRole('button', { name: '日記を作成' }).click();

// ✅ Good: text を使用
await page.getByText('日記を保存しました').waitFor();

// ⚠️ Avoid: CSS セレクター（可能な限り避ける）
await page.locator('.btn-primary').click();
```

### 4.3 data-testid の追加

実装時には、主要な要素に `data-testid` を追加します：

```typescript
// src/components/diary/DiaryCreateButton.tsx
export function DiaryCreateButton() {
  return (
    <Button data-testid="diary-create-button">
      日記を作成
    </Button>
  );
}
```

---

## 5. 過度な待機を避ける

### 5.1 自動待機の活用

Playwright は**自動的に要素の出現を待機**するため、明示的な `sleep()` は不要です。

```typescript
// ❌ Bad: 明示的な待機
await page.waitForTimeout(1000);
await page.click('button');

// ✅ Good: 自動待機
await page.getByRole('button', { name: '送信' }).click();
```

### 5.2 明示的な待機が必要な場合

以下の場合のみ、明示的な待機を使用します：

```typescript
// ✅ Good: ネットワークリクエストの完了を待つ
await page.waitForResponse(response => 
  response.url().includes('/api/diaries') && response.status() === 201
);

// ✅ Good: 特定の状態になるまで待つ
await page.waitForSelector('[data-testid="diary-list"]', { state: 'visible' });
```

---

## 6. テスト対象 / 非対象

### 6.1 テスト対象

#### 6.1.1 主要なユーザーフロー

- **認証フロー**: ログイン、ログアウト、新規登録
- **日記作成フロー**: 日記の作成、保存、成功通知
- **日記編集フロー**: 日記の編集、更新、成功通知
- **日記削除フロー**: 日記の削除、確認ダイアログ、成功通知
- **日記一覧表示**: 日記一覧の表示、フィルタリング、ページネーション
- **カレンダー表示**: カレンダービューの表示、日付選択

#### 6.1.2 UI/UX の検証

- **フォームバリデーション**: 無効な入力時のエラーメッセージ表示
- **トースト通知**: 成功・失敗時のトースト通知表示
- **ローディング状態**: データ読み込み中のローディング表示
- **エラーハンドリング**: エラー発生時のエラーメッセージ表示

#### 6.1.3 レスポンシブデザイン

- **モバイル表示**: スマートフォンでの表示・操作
- **タブレット表示**: タブレットでの表示・操作
- **デスクトップ表示**: デスクトップでの表示・操作

### 6.2 テスト非対象

- **単純な UI コンポーネント**: 単体テストで検証
- **ユーティリティ関数**: 単体テストで検証
- **API Route Handler**: 結合テストで検証
- **データベース操作**: 結合テストで検証

---

## 7. テストアカウント管理

### 7.1 テストアカウントの作成

E2Eテストでは、**専用のテストアカウント**を使用します。

```typescript
// e2e/helpers/auth.ts
import { Page } from '@playwright/test';

export async function createTestUser(page: Page) {
  // テスト用のユーザーを作成
  await page.goto('/register');
  await page.fill('input[name="email"]', `test-${Date.now()}@example.com`);
  await page.fill('input[name="password"]', 'password123');
  await page.fill('input[name="display_name"]', 'Test User');
  await page.click('button[type="submit"]');
  
  // ログイン完了を待つ
  await page.waitForURL('/');
}

export async function loginAsTestUser(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  
  // ログイン完了を待つ
  await page.waitForURL('/');
}
```

### 7.2 テストアカウントのクリーンアップ

```typescript
// e2e/helpers/cleanup.ts
import { createSupabaseServiceRoleClient } from '@/__tests__/helpers/supabase';

export async function cleanupTestUser(email: string) {
  const supabase = createSupabaseServiceRoleClient();
  const { data: users } = await supabase.auth.admin.listUsers();
  const user = users.users.find(u => u.email === email);
  
  if (user) {
    await supabase.auth.admin.deleteUser(user.id);
    await supabase.from('t_diaries').delete().eq('user_id', user.id);
  }
}
```

---

## 8. テストデータ初期化

### 8.1 テストデータのセットアップ

E2Eテストでは、**各テスト前にテストデータを初期化**します。

```typescript
// e2e/helpers/fixtures.ts
import { createSupabaseServiceRoleClient } from '@/__tests__/helpers/supabase';

export async function setupTestData(userId: string) {
  const supabase = createSupabaseServiceRoleClient();
  
  // テスト用の日記を作成
  await supabase.from('t_diaries').insert({
    user_id: userId,
    diary_date: '2025-01-10',
    note: 'Test diary',
    mood: 5,
  });
}

export async function cleanupTestData(userId: string) {
  const supabase = createSupabaseServiceRoleClient();
  await supabase.from('t_diaries').delete().eq('user_id', userId);
}
```

### 8.2 テストデータの使用

```typescript
// e2e/diary/list.spec.ts
import { test, expect } from '@playwright/test';
import { createTestUser, loginAsTestUser } from '../helpers/auth';
import { setupTestData, cleanupTestData } from '../helpers/fixtures';

test.describe('日記一覧', () => {
  let testUserId: string;
  let testEmail: string;

  test.beforeEach(async ({ page }) => {
    // テストユーザーを作成
    testEmail = `test-${Date.now()}@example.com`;
    await createTestUser(page, testEmail, 'password123');
    
    // テストデータをセットアップ
    // （実際の実装では、API 経由でユーザーIDを取得）
    await setupTestData(testUserId);
  });

  test.afterEach(async () => {
    // テストデータをクリーンアップ
    await cleanupTestData(testUserId);
  });

  test('日記一覧が表示される', async ({ page }) => {
    await page.goto('/diary');
    
    // 日記一覧が表示されることを確認
    await expect(page.getByTestId('diary-list')).toBeVisible();
    await expect(page.getByText('Test diary')).toBeVisible();
  });
});
```

---

## 9. クロスブラウザ / モバイル

### 9.1 クロスブラウザテスト

```typescript
// playwright.config.ts
export default defineConfig({
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
});
```

### 9.2 モバイルテスト

```typescript
// playwright.config.ts
export default defineConfig({
  projects: [
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
});
```

### 9.3 モバイル固有のテスト

```typescript
// e2e/diary/create-mobile.spec.ts
import { test, expect } from '@playwright/test';

test.describe('日記作成（モバイル）', () => {
  test.use({ ...devices['iPhone 12'] });

  test('モバイルで日記を作成できる', async ({ page }) => {
    await page.goto('/diary/new');
    
    // モバイルでの表示を確認
    await expect(page.getByTestId('diary-editor')).toBeVisible();
    
    // 日記を入力
    await page.fill('textarea[name="note"]', 'Mobile test diary');
    await page.click('button[type="submit"]');
    
    // 成功通知を確認
    await expect(page.getByText('日記を保存しました')).toBeVisible();
  });
});
```

---

## 10. シナリオ作成

### 10.1 ユーザーシナリオの記述

E2Eテストでは、**実際のユーザーシナリオ**を記述します。

```typescript
// e2e/diary/create.spec.ts
import { test, expect } from '@playwright/test';

test.describe('日記作成フロー', () => {
  test('ユーザーが日記を作成できる', async ({ page }) => {
    // 1. ログイン
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');

    // 2. 日記作成ページに移動
    await page.goto('/diary/new');
    await expect(page.getByTestId('diary-editor')).toBeVisible();

    // 3. 日記を入力
    await page.fill('textarea[name="note"]', '今日は良い天気でした。');
    await page.fill('input[name="mood"]', '7');
    await page.click('button[type="submit"]');

    // 4. 成功通知を確認
    await expect(page.getByText('日記を保存しました')).toBeVisible();

    // 5. 日記一覧にリダイレクトされることを確認
    await page.waitForURL('/diary');
    await expect(page.getByText('今日は良い天気でした。')).toBeVisible();
  });

  test('無効な入力時にエラーメッセージが表示される', async ({ page }) => {
    await page.goto('/diary/new');
    
    // 日付を入力せずに送信
    await page.fill('textarea[name="note"]', 'Test note');
    await page.click('button[type="submit"]');

    // エラーメッセージを確認
    await expect(page.getByText('日付は必須です')).toBeVisible();
  });
});
```

### 10.2 複数のステップを含むシナリオ

```typescript
// e2e/diary/crud.spec.ts
import { test, expect } from '@playwright/test';

test.describe('日記 CRUD フロー', () => {
  test('ユーザーが日記を作成・編集・削除できる', async ({ page }) => {
    // 1. ログイン
    await loginAsTestUser(page, 'test@example.com', 'password123');

    // 2. 日記を作成
    await page.goto('/diary/new');
    await page.fill('textarea[name="note"]', '最初の日記');
    await page.click('button[type="submit"]');
    await expect(page.getByText('日記を保存しました')).toBeVisible();

    // 3. 日記一覧で作成した日記を確認
    await page.goto('/diary');
    await expect(page.getByText('最初の日記')).toBeVisible();

    // 4. 日記を編集
    await page.click('[data-testid="diary-edit-button"]');
    await page.fill('textarea[name="note"]', '編集した日記');
    await page.click('button[type="submit"]');
    await expect(page.getByText('日記を更新しました')).toBeVisible();

    // 5. 日記を削除
    await page.click('[data-testid="diary-delete-button"]');
    await page.click('[data-testid="confirm-delete-button"]');
    await expect(page.getByText('日記を削除しました')).toBeVisible();
    await expect(page.getByText('編集した日記')).not.toBeVisible();
  });
});
```

---

## 11. 実装例

### 11.1 日記作成の E2Eテスト

```typescript
// e2e/diary/create.spec.ts
import { test, expect } from '@playwright/test';
import { loginAsTestUser } from '../helpers/auth';

test.describe('日記作成', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page, 'test@example.com', 'password123');
  });

  test('日記を作成できる', async ({ page }) => {
    await page.goto('/diary/new');
    
    // フォームに入力
    await page.fill('input[name="diary_date"]', '2025-01-10');
    await page.fill('textarea[name="note"]', '今日は良い天気でした。');
    await page.fill('input[name="mood"]', '7');
    
    // 送信
    await page.click('button[type="submit"]');
    
    // 成功通知を確認
    await expect(page.getByText('日記を保存しました')).toBeVisible();
    
    // 日記一覧にリダイレクトされることを確認
    await page.waitForURL('/diary');
    await expect(page.getByText('今日は良い天気でした。')).toBeVisible();
  });

  test('無効な入力時にエラーメッセージが表示される', async ({ page }) => {
    await page.goto('/diary/new');
    
    // 日付を入力せずに送信
    await page.fill('textarea[name="note"]', 'Test note');
    await page.click('button[type="submit"]');
    
    // エラーメッセージを確認
    await expect(page.getByText('日付は必須です')).toBeVisible();
  });

  test('note が 10000 文字を超える場合にエラーメッセージが表示される', async ({ page }) => {
    await page.goto('/diary/new');
    
    // 10001 文字を入力
    await page.fill('textarea[name="note"]', 'a'.repeat(10001));
    await page.fill('input[name="diary_date"]', '2025-01-10');
    await page.click('button[type="submit"]');
    
    // エラーメッセージを確認
    await expect(page.getByText('note は 10000 文字以下である必要があります')).toBeVisible();
  });
});
```

### 11.2 認証フローの E2Eテスト

```typescript
// e2e/auth/login.spec.ts
import { test, expect } from '@playwright/test';

test.describe('認証フロー', () => {
  test('ログインできる', async ({ page }) => {
    await page.goto('/login');
    
    // ログインフォームに入力
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // ログイン成功を確認
    await page.waitForURL('/');
    await expect(page.getByTestId('user-menu')).toBeVisible();
  });

  test('無効な認証情報でログインできない', async ({ page }) => {
    await page.goto('/login');
    
    // 無効な認証情報を入力
    await page.fill('input[name="email"]', 'invalid@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // エラーメッセージを確認
    await expect(page.getByText('メールアドレスまたはパスワードが正しくありません')).toBeVisible();
  });

  test('ログアウトできる', async ({ page }) => {
    // ログイン
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
    
    // ログアウト
    await page.click('[data-testid="user-menu"]');
    await page.click('[data-testid="logout-button"]');
    
    // ログアウト成功を確認
    await page.waitForURL('/login');
    await expect(page.getByText('ログイン')).toBeVisible();
  });
});
```

### 11.3 カレンダー表示の E2Eテスト

```typescript
// e2e/calendar/view.spec.ts
import { test, expect } from '@playwright/test';
import { loginAsTestUser, setupTestData } from '../helpers';

test.describe('カレンダー表示', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page, 'test@example.com', 'password123');
    await setupTestData('test@example.com');
  });

  test('カレンダーで日記を表示できる', async ({ page }) => {
    await page.goto('/calendar');
    
    // カレンダーが表示されることを確認
    await expect(page.getByTestId('calendar-view')).toBeVisible();
    
    // 日記がある日付をクリック
    await page.click('[data-testid="calendar-day-2025-01-10"]');
    
    // 日記の詳細が表示されることを確認
    await expect(page.getByTestId('diary-detail')).toBeVisible();
    await expect(page.getByText('Test diary')).toBeVisible();
  });

  test('月ビュー・週ビュー・日ビューを切り替えられる', async ({ page }) => {
    await page.goto('/calendar');
    
    // 月ビューを確認
    await expect(page.getByTestId('calendar-month-view')).toBeVisible();
    
    // 週ビューに切り替え
    await page.click('[data-testid="view-week-tab"]');
    await expect(page.getByTestId('calendar-week-view')).toBeVisible();
    
    // 日ビューに切り替え
    await page.click('[data-testid="view-day-tab"]');
    await expect(page.getByTestId('calendar-day-view')).toBeVisible();
  });
});
```

---

## 12. Cursor 自動生成の注意点

### 12.1 Cursor への指示

Cursor が E2Eテストを生成する際は、以下の情報を参照してください：

1. **テスト戦略ドキュメント**
   - `docs/700_E2E_Test/700Strategy.md`（本ドキュメント）
   - `docs/400_Test_Operation_Guideline/` 配下のドキュメント

2. **既存テスト例**
   - `e2e/**/*.spec.ts` - 既存の E2Eテスト

3. **実装コード**
   - `src/app/**/page.tsx` - ページコンポーネント
   - `src/components/**` - UI コンポーネント

### 12.2 自動生成時の注意点

- **data-testid の使用**: 可能な限り `data-testid` を使用
- **自動待機の活用**: 明示的な `sleep()` は避ける
- **ユーザーシナリオの記述**: 実際のユーザーの操作をシミュレート
- **正常系・異常系**: 両方のテストケースを含める
- **クロスブラウザ**: 主要なブラウザでの動作を確認

### 12.3 生成されたテストの確認

Cursor が生成した E2Eテストは、以下の点を確認してください：

- **セレクターの安定性**: `data-testid` が使用されているか
- **待機戦略**: 適切な自動待機が使用されているか
- **エラーハンドリング**: エラーケースが含まれているか
- **クリーンアップ**: テストデータのクリーンアップが実装されているか

---

**関連ドキュメント:**
- [テスト運用ガイドライン](../400_Test_Operation_Guideline/400_Guideline.md)
- [単体テスト戦略](../500_Unit_Test/500_Strategy.md)
- [結合テスト戦略](../600_Integration_Test/600_Strategy.md)
- [画面一覧（UI設計）](../202_DetailedDesign/203_DetailedDesign_UI.md)
- [機能設計](../202_DetailedDesign/204_DetailedDesign_Functions.md)

