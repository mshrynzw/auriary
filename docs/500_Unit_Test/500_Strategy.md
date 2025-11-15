# 単体テスト戦略

## 1. 目的

単体テストは、個別の関数・コンポーネント・ユーティリティの動作を検証するテストです。auriary プロジェクトでは、**最小限の単体テスト哲学**を採用し、重要なロジックとバリデーションに焦点を当てます。

### 1.1 単体テストの役割

- **バリデーションロジックの検証**: Zod スキーマ、フォームバリデーション
- **ユーティリティ関数の検証**: 日付フォーマット、文字列処理、計算ロジック
- **型安全性の確認**: TypeScript の型定義が正しく機能しているか
- **エッジケースの検証**: 境界値、異常値の処理

---

## 2. 最小限の単体テスト哲学

### 2.1 テスト対象の優先順位

auriary プロジェクトでは、以下の優先順位で単体テストを実装します：

1. **最優先**: Zod スキーマ、バリデーション関数
2. **高優先**: ビジネスロジック、計算関数、フォーマット関数
3. **中優先**: ユーティリティ関数、ヘルパー関数
4. **低優先**: 単純なゲッター/セッター、定数の定義

### 2.2 テストしないもの

- **UI コンポーネント**: E2Eテストで検証（単体テストは最小限）
- **Server Components**: 結合テストで検証
- **Server Actions**: 結合テストで検証
- **API Route Handlers**: 結合テストで検証
- **データベース操作**: 結合テストで検証

---

## 3. テスト対象 / 非対象

### 3.1 テスト対象

#### 3.1.1 Zod スキーマ

```typescript
// src/lib/validators/diary.test.ts
import { describe, it, expect } from 'vitest';
import { createDiarySchema } from './diary';

describe('createDiarySchema', () => {
  it('有効な日記データを検証する', () => {
    const data = {
      diary_date: '2025-01-10',
      note: 'Test note',
      mood: 5,
    };
    expect(createDiarySchema.parse(data)).toEqual(data);
  });

  it('無効な日付形式を拒否する', () => {
    const data = {
      diary_date: 'invalid-date',
      note: 'Test note',
    };
    expect(() => createDiarySchema.parse(data)).toThrow();
  });

  it('note が 10000 文字を超える場合にエラーを投げる', () => {
    const data = {
      diary_date: '2025-01-10',
      note: 'a'.repeat(10001),
    };
    expect(() => createDiarySchema.parse(data)).toThrow();
  });
});
```

#### 3.1.2 ユーティリティ関数

```typescript
// src/lib/utils/date.test.ts
import { describe, it, expect } from 'vitest';
import { formatDiaryDate, parseDiaryDate } from './date';

describe('formatDiaryDate', () => {
  it('日付を YYYY-MM-DD 形式でフォーマットする', () => {
    const date = new Date('2025-01-10');
    expect(formatDiaryDate(date)).toBe('2025-01-10');
  });

  it('無効な日付の場合はエラーを投げる', () => {
    expect(() => formatDiaryDate(new Date('invalid'))).toThrow();
  });
});

describe('parseDiaryDate', () => {
  it('YYYY-MM-DD 形式の文字列を Date オブジェクトに変換する', () => {
    const date = parseDiaryDate('2025-01-10');
    expect(date.getFullYear()).toBe(2025);
    expect(date.getMonth()).toBe(0); // 0-indexed
    expect(date.getDate()).toBe(10);
  });
});
```

#### 3.1.3 ビジネスロジック

```typescript
// src/lib/utils/mood.test.ts
import { describe, it, expect } from 'vitest';
import { calculateMoodAverage, validateMoodScore } from './mood';

describe('validateMoodScore', () => {
  it('1-10 の範囲の値を許可する', () => {
    expect(validateMoodScore(1)).toBe(true);
    expect(validateMoodScore(5)).toBe(true);
    expect(validateMoodScore(10)).toBe(true);
  });

  it('範囲外の値を拒否する', () => {
    expect(validateMoodScore(0)).toBe(false);
    expect(validateMoodScore(11)).toBe(false);
    expect(validateMoodScore(-1)).toBe(false);
  });
});

describe('calculateMoodAverage', () => {
  it('複数の mood スコアの平均を計算する', () => {
    const moods = [5, 7, 6, 8];
    expect(calculateMoodAverage(moods)).toBe(6.5);
  });

  it('空の配列の場合は 0 を返す', () => {
    expect(calculateMoodAverage([])).toBe(0);
  });
});
```

### 3.2 テスト非対象

- **UI コンポーネント**: E2Eテストで検証
- **Server Components**: 結合テストで検証
- **Server Actions**: 結合テストで検証
- **API Route Handlers**: 結合テストで検証
- **データベース操作**: 結合テストで検証

---

## 4. Vitest ルール

### 4.1 基本設定

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    exclude: ['node_modules', '.next', 'e2e'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        '.next/',
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/__tests__/**',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### 4.2 テストファイルの命名規則

- **パターン**: `<filename>.test.ts` または `<filename>.test.tsx`
- **配置**: テスト対象ファイルと同じディレクトリ
- **例**: 
  - `src/lib/validators/diary.ts` → `src/lib/validators/diary.test.ts`
  - `src/lib/utils/date.ts` → `src/lib/utils/date.test.ts`

### 4.3 テストの構造

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('関数名またはモジュール名', () => {
  // セットアップ（必要に応じて）
  beforeEach(() => {
    // 各テスト前の処理
  });

  afterEach(() => {
    // 各テスト後の処理
  });

  it('テストケースの説明（日本語可）', () => {
    // Arrange（準備）
    const input = 'test';

    // Act（実行）
    const result = functionUnderTest(input);

    // Assert（検証）
    expect(result).toBe('expected');
  });
});
```

---

## 5. モッキング

### 5.1 モックの使用方針

単体テストでは、**外部依存を可能な限りモック化**します。

- **Supabase クライアント**: モック化
- **外部 API（OpenAI）**: モック化
- **環境変数**: モック化（必要に応じて）
- **Date / Time**: モック化（必要に応じて）

### 5.2 モックの例

```typescript
// src/lib/utils/date.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('formatDiaryDate with mocked Date', () => {
  beforeEach(() => {
    // Date を固定
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-10'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('現在の日付をフォーマットする', () => {
    const result = formatDiaryDate(new Date());
    expect(result).toBe('2025-01-10');
  });
});
```

```typescript
// src/lib/validators/diary.test.ts
import { describe, it, expect, vi } from 'vitest';
import { validateDiaryDate } from './diary';

// 外部関数をモック化
vi.mock('@/lib/supabase', () => ({
  createSupabaseServerClient: vi.fn(),
}));

describe('validateDiaryDate', () => {
  it('有効な日付を検証する', () => {
    const result = validateDiaryDate('2025-01-10');
    expect(result).toBe(true);
  });
});
```

---

## 6. 命名規則

### 6.1 テストファイル名

- **パターン**: `<filename>.test.ts` または `<filename>.test.tsx`
- **例**: 
  - `diary.test.ts`
  - `date.test.ts`
  - `mood.test.ts`

### 6.2 テストスイート名

- **パターン**: `describe('関数名またはモジュール名', () => { ... })`
- **例**: 
  - `describe('createDiarySchema', () => { ... })`
  - `describe('formatDiaryDate', () => { ... })`

### 6.3 テストケース名

- **パターン**: `it('テストケースの説明（日本語可）', () => { ... })`
- **例**: 
  - `it('有効な日記データを検証する', () => { ... })`
  - `it('無効な日付形式を拒否する', () => { ... })`

---

## 7. フォルダ構造

```
src/
├── lib/
│   ├── validators/
│   │   ├── diary.ts
│   │   └── diary.test.ts          # 同じディレクトリ
│   ├── utils/
│   │   ├── date.ts
│   │   ├── date.test.ts           # 同じディレクトリ
│   │   ├── mood.ts
│   │   └── mood.test.ts
│   └── supabase.ts
├── components/
│   └── ui/
│       ├── button.tsx
│       └── button.test.tsx         # UI コンポーネントは最小限
└── __tests__/                      # 統合テスト用（単体テストではない）
    └── integration/
```

---

## 8. テストデータ

### 8.1 テストデータの管理

- **インライン**: 小さなテストデータはテスト内に直接記述
- **ファクトリー関数**: 複雑なテストデータはファクトリー関数を使用
- **フィクスチャ**: 共通のテストデータは `src/__tests__/fixtures/` に配置

### 8.2 ファクトリー関数の例

```typescript
// src/__tests__/fixtures/diary.ts
import { z } from 'zod';
import { createDiarySchema } from '@/lib/validators/diary';

export function createDiaryFixture(overrides?: Partial<z.infer<typeof createDiarySchema>>) {
  return {
    diary_date: '2025-01-10',
    note: 'Test note',
    mood: 5,
    ...overrides,
  };
}
```

```typescript
// src/lib/validators/diary.test.ts
import { createDiaryFixture } from '@/__tests__/fixtures/diary';

describe('createDiarySchema', () => {
  it('有効な日記データを検証する', () => {
    const data = createDiaryFixture();
    expect(createDiarySchema.parse(data)).toEqual(data);
  });

  it('無効な日付を拒否する', () => {
    const data = createDiaryFixture({ diary_date: 'invalid' });
    expect(() => createDiarySchema.parse(data)).toThrow();
  });
});
```

---

## 9. カバレッジ

### 9.1 カバレッジ目標

- **Zod スキーマ**: 100%
- **バリデーション関数**: 100%
- **ユーティリティ関数**: 80%以上
- **ビジネスロジック**: 80%以上

### 9.2 カバレッジレポート

```bash
# カバレッジレポートを生成
pnpm test:unit:coverage

# カバレッジレポートを確認
open coverage/index.html
```

---

## 10. 実装例

### 10.1 Zod スキーマのテスト

```typescript
// src/lib/validators/diary.test.ts
import { describe, it, expect } from 'vitest';
import { createDiarySchema, updateDiarySchema } from './diary';

describe('createDiarySchema', () => {
  it('有効な日記データを検証する', () => {
    const data = {
      diary_date: '2025-01-10',
      note: 'Test note',
      mood: 5,
    };
    expect(createDiarySchema.parse(data)).toEqual(data);
  });

  it('diary_date が必須であることを検証する', () => {
    const data = {
      note: 'Test note',
    };
    expect(() => createDiarySchema.parse(data)).toThrow();
  });

  it('note が 10000 文字を超える場合にエラーを投げる', () => {
    const data = {
      diary_date: '2025-01-10',
      note: 'a'.repeat(10001),
    };
    expect(() => createDiarySchema.parse(data)).toThrow();
  });

  it('mood が 1-10 の範囲内であることを検証する', () => {
    const validData = {
      diary_date: '2025-01-10',
      mood: 5,
    };
    expect(createDiarySchema.parse(validData)).toEqual(validData);

    const invalidData = {
      diary_date: '2025-01-10',
      mood: 11,
    };
    expect(() => createDiarySchema.parse(invalidData)).toThrow();
  });
});
```

### 10.2 ユーティリティ関数のテスト

```typescript
// src/lib/utils/date.test.ts
import { describe, it, expect } from 'vitest';
import { formatDiaryDate, parseDiaryDate, isToday } from './date';

describe('formatDiaryDate', () => {
  it('日付を YYYY-MM-DD 形式でフォーマットする', () => {
    const date = new Date('2025-01-10T12:00:00Z');
    expect(formatDiaryDate(date)).toBe('2025-01-10');
  });

  it('無効な日付の場合はエラーを投げる', () => {
    expect(() => formatDiaryDate(new Date('invalid'))).toThrow();
  });
});

describe('parseDiaryDate', () => {
  it('YYYY-MM-DD 形式の文字列を Date オブジェクトに変換する', () => {
    const date = parseDiaryDate('2025-01-10');
    expect(date.getFullYear()).toBe(2025);
    expect(date.getMonth()).toBe(0);
    expect(date.getDate()).toBe(10);
  });

  it('無効な形式の場合はエラーを投げる', () => {
    expect(() => parseDiaryDate('invalid')).toThrow();
  });
});

describe('isToday', () => {
  it('今日の日付の場合に true を返す', () => {
    const today = new Date();
    expect(isToday(today)).toBe(true);
  });

  it('昨日の日付の場合に false を返す', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    expect(isToday(yesterday)).toBe(false);
  });
});
```

---

## 11. タイミングルール

### 11.1 テスト実行タイミング

- **開発時**: ウォッチモードで実行（`pnpm test:unit:watch`）
- **コミット前**: すべての単体テストを実行（`pnpm test:unit`）
- **PR時**: CI/CD で自動実行
- **デプロイ前**: すべての単体テストを実行

### 11.2 テスト作成タイミング

- **機能実装時**: バリデーション関数、ユーティリティ関数と同時に作成
- **リファクタリング時**: 既存のテストを更新
- **バグ修正時**: 再発防止のためのテストを追加

---

## 12. Cursor 自動生成情報

### 12.1 Cursor への指示

Cursor が単体テストを生成する際は、以下の情報を参照してください：

1. **テスト戦略ドキュメント**
   - `docs/500_Unit_Test/500_Strategy.md`（本ドキュメント）
   - `docs/400_Test_Operation_Guideline/` 配下のドキュメント

2. **既存テスト例**
   - `src/**/*.test.ts` - 既存の単体テスト
   - `src/__tests__/fixtures/` - テストデータファクトリー

3. **実装コード**
   - テスト対象のコード
   - 関連する型定義
   - Zod スキーマ

### 12.2 自動生成時の注意点

- **最小限のテスト**: UI コンポーネントの単体テストは最小限に
- **モックの使用**: 外部依存は必ずモック化
- **日本語のテスト名**: テストケース名は日本語で記述
- **カバレッジ**: Zod スキーマは 100% カバレッジを目指す

---

**関連ドキュメント:**
- [テスト運用ガイドライン](../400_Test_Operation_Guideline/400_Guideline.md)
- [結合テスト戦略](../600_Integration_Test/600_Strategy.md)
- [E2Eテスト戦略](../700_E2E_Test/700Strategy.md)
- [コーディング規約（概要）](../300_Cording/301_CodingStandards.md)

