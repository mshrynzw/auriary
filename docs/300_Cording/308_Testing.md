# テスト方針

## テスト方針

本ドキュメントは、auriary プロジェクトにおけるテスト方針を定めたものです。

**注意**: テストの実装は将来のタスクとして計画されています。

---

## テストの目的

### テストの重要性

1. **品質保証**: バグの早期発見
2. **リファクタリングの安全性**: 既存機能が壊れていないことを確認
3. **ドキュメント**: テストがコードの使用方法を示す
4. **開発速度**: 自動テストにより手動テストの時間を削減

---

## テストの種類

### 1. ユニットテスト（Unit Tests）

**目的**: 個別の関数・コンポーネントの動作を検証

**対象**:
- ユーティリティ関数
- カスタムフック
- 個別のコンポーネント

**ツール**:
- Jest
- React Testing Library
- Vitest（将来検討）

### 2. 統合テスト（Integration Tests）

**目的**: 複数のコンポーネント・モジュールの連携を検証

**対象**:
- コンポーネント間の連携
- API とデータベースの連携
- 認証フロー

**ツール**:
- Jest
- React Testing Library
- MSW（Mock Service Worker）

### 3. E2Eテスト（End-to-End Tests）

**目的**: ユーザーシナリオ全体を検証

**対象**:
- 主要なユーザーフロー
- 認証フロー
- 日記作成・編集・削除フロー

**ツール**:
- Playwright（推奨）
- Cypress（将来検討）

---

## テストカバレッジ目標

### カバレッジ目標

- **ユニットテスト**: 80%以上
- **統合テスト**: 主要な機能をカバー
- **E2Eテスト**: 主要なユーザーフローをカバー

### カバレッジの測定

```bash
# カバレッジレポートを生成
npm run test:coverage
```

---

## テストファイルの配置

### ファイル構造

```
src/
├── components/
│   ├── diary/
│   │   ├── DiaryCard.tsx
│   │   └── DiaryCard.test.tsx      # 同じディレクトリ
│   └── common/
│       ├── Header.tsx
│       └── Header.test.tsx
├── lib/
│   ├── utils.ts
│   └── utils.test.ts               # 同じディレクトリ
└── __tests__/                      # 統合テスト
    └── integration/
        └── diary.test.ts
```

---

## ユニットテスト

### コンポーネントテスト

```typescript
// ✅ Good: コンポーネントテストの例
import { render, screen } from '@testing-library/react';
import { DiaryCard } from './DiaryCard';

describe('DiaryCard', () => {
  const mockDiary = {
    id: 1,
    title: 'Test Diary',
    note: 'Test note',
    diary_date: '2025-01-10',
  };

  it('日記のタイトルと本文を表示する', () => {
    render(<DiaryCard diary={mockDiary} />);
    
    expect(screen.getByText('Test Diary')).toBeInTheDocument();
    expect(screen.getByText('Test note')).toBeInTheDocument();
  });

  it('編集ボタンがクリックされたときに onEdit を呼び出す', () => {
    const onEdit = jest.fn();
    render(<DiaryCard diary={mockDiary} onEdit={onEdit} />);
    
    const editButton = screen.getByRole('button', { name: '編集' });
    editButton.click();
    
    expect(onEdit).toHaveBeenCalledWith(mockDiary.id);
  });
});
```

### ユーティリティ関数のテスト

```typescript
// ✅ Good: ユーティリティ関数のテスト
import { formatDate } from './formatDate';

describe('formatDate', () => {
  it('日付を正しい形式でフォーマットする', () => {
    const date = new Date('2025-01-10');
    expect(formatDate(date)).toBe('2025年1月10日');
  });

  it('無効な日付の場合はエラーを投げる', () => {
    expect(() => formatDate(new Date('invalid'))).toThrow();
  });
});
```

---

## 統合テスト

### API統合テスト

```typescript
// ✅ Good: API統合テストの例
import { createDiary } from '@/lib/api/diary';
import { server } from '@/mocks/server';

describe('createDiary', () => {
  it('日記を作成できる', async () => {
    const diaryData = {
      diary_date: '2025-01-10',
      note: 'Test note',
    };

    const diary = await createDiary(diaryData);

    expect(diary.id).toBeDefined();
    expect(diary.note).toBe('Test note');
  });

  it('バリデーションエラーの場合はエラーを投げる', async () => {
    const invalidData = {
      diary_date: '',
      note: '',
    };

    await expect(createDiary(invalidData)).rejects.toThrow();
  });
});
```

---

## E2Eテスト

### ユーザーフローのテスト

```typescript
// ✅ Good: E2Eテストの例（Playwright）
import { test, expect } from '@playwright/test';

test('日記を作成できる', async ({ page }) => {
  // ログイン
  await page.goto('/login');
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'password');
  await page.click('button[type="submit"]');

  // 日記作成ページに移動
  await page.goto('/diary/new');

  // 日記を入力
  await page.fill('textarea[name="note"]', 'Test diary');
  await page.click('button[type="submit"]');

  // 日記が作成されたことを確認
  await expect(page.locator('text=日記を保存しました')).toBeVisible();
});
```

---

## モック・スタブ

### API のモック

```typescript
// ✅ Good: MSW を使用したAPIモック
import { rest } from 'msw';
import { setupServer } from 'msw/node';

export const server = setupServer(
  rest.get('/api/diaries', (req, res, ctx) => {
    return res(
      ctx.json({
        diaries: [
          { id: 1, title: 'Test Diary', note: 'Test note' },
        ],
      })
    );
  })
);
```

---

## テストの実行

### テストコマンド

```bash
# すべてのテストを実行
npm run test

# ウォッチモードで実行
npm run test:watch

# カバレッジレポートを生成
npm run test:coverage

# E2Eテストを実行
npm run test:e2e
```

---

## テストのベストプラクティス

### 1. テストの独立性

- テストは互いに独立している
- テストの実行順序に依存しない

### 2. テストの明確性

- テスト名は意図が明確になるように
- 1つのテストは1つのことを検証

### 3. テストの保守性

- テストコードも保守しやすく
- 重複を避ける

### 4. テストの速度

- テストは高速に実行できるように
- 非同期処理は適切に処理

---

## 将来の実装計画

### Phase 1: ユニットテスト

- ユーティリティ関数のテスト
- カスタムフックのテスト
- 基本的なコンポーネントのテスト

### Phase 2: 統合テスト

- API統合テスト
- コンポーネント間の連携テスト

### Phase 3: E2Eテスト

- 主要なユーザーフローのテスト
- 認証フローのテスト

---

**関連ドキュメント:**
- [コーディング規約（概要）](./301_CodingStandards.md)
- [コンポーネント設計原則](./305_ComponentDesign.md)

