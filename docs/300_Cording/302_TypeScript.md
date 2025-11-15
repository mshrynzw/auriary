# TypeScript コーディング規約

## TypeScript コーディング規約

本ドキュメントは、auriary プロジェクトにおける TypeScript のコーディング規約を定めたものです。

---

## 基本方針

### 1. 型安全性の確保

- TypeScript の型システムを最大限に活用
- `any` の使用を避ける（やむを得ない場合は `unknown` を使用）
- 型推論を活用しつつ、必要な箇所では明示的に型を指定

### 2. 厳格な型チェック

- `tsconfig.json` で `strict: true` を設定
- 未使用変数・インポートを削除
- 型エラーは必ず修正

---

## 型定義の書き方

### interface vs type

**interface を使用する場合：**
- オブジェクトの型定義
- 拡張可能な型定義
- 公開APIの型定義

```typescript
// ✅ Good: interface を使用
interface Diary {
  id: number;
  user_id: number;
  diary_date: string;
  note: string | null;
}

// 拡張可能
interface DiaryWithUser extends Diary {
  user: User;
}
```

**type を使用する場合：**
- ユニオン型、インターセクション型
- 型エイリアス
- 複雑な型操作

```typescript
// ✅ Good: type を使用
type DiaryStatus = 'draft' | 'published' | 'archived';

type DiaryWithStatus = Diary & {
  status: DiaryStatus;
};
```

### 型推論の活用

```typescript
// ✅ Good: 型推論を活用
const diaries = await getDiaries(); // Diary[] と推論される

// ⚠️ 必要な場合のみ明示的に型を指定
const diaries: Diary[] = await getDiaries();
```

---

## any の使用禁止

### any を使用しない

```typescript
// ❌ Bad: any を使用
function processData(data: any) {
  return data.value;
}

// ✅ Good: 適切な型を指定
function processData(data: { value: string }) {
  return data.value;
}

// ✅ Good: 型が不明な場合は unknown を使用
function processData(data: unknown) {
  if (typeof data === 'object' && data !== null && 'value' in data) {
    return (data as { value: string }).value;
  }
  throw new Error('Invalid data');
}
```

### やむを得ない場合

- サードパーティライブラリの型定義が不完全な場合
- 段階的な型付けの移行中
- コメントで理由を明記

```typescript
// ⚠️ やむを得ない場合（コメントで理由を明記）
// TODO: @types/legacy-library の型定義が不完全なため、一時的に any を使用
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const result: any = legacyLibrary.process();
```

---

## 型ガードの使用

### 型ガード関数

```typescript
// ✅ Good: 型ガード関数を定義
function isDiary(obj: unknown): obj is Diary {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'user_id' in obj &&
    'diary_date' in obj
  );
}

// 使用例
function processDiary(data: unknown) {
  if (isDiary(data)) {
    // data は Diary 型として扱える
    console.log(data.id);
  }
}
```

### typeof / instanceof の活用

```typescript
// ✅ Good: typeof を使用
function processValue(value: unknown) {
  if (typeof value === 'string') {
    return value.toUpperCase();
  }
  if (typeof value === 'number') {
    return value * 2;
  }
  throw new Error('Invalid value type');
}

// ✅ Good: instanceof を使用
function processError(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }
  return 'Unknown error';
}
```

---

## ジェネリクスの活用

### 再利用可能な型定義

```typescript
// ✅ Good: ジェネリクスを使用
interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}

type DiaryResponse = ApiResponse<Diary>;
type DiariesResponse = ApiResponse<Diary[]>;
```

### 制約付きジェネリクス

```typescript
// ✅ Good: 制約付きジェネリクス
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}
```

---

## 型アサーション

### 型アサーションの使用

```typescript
// ⚠️ 型アサーションは最小限に
// 型が確実に分かっている場合のみ使用

// ✅ Good: 型ガードの後で使用
function processData(data: unknown) {
  if (isDiary(data)) {
    const diary = data as Diary; // 型ガードの後なので安全
    return diary;
  }
}

// ❌ Bad: 型チェックなしで型アサーション
const diary = data as Diary; // 危険
```

---

## オプショナルチェーンと Nullish Coalescing

### オプショナルチェーン

```typescript
// ✅ Good: オプショナルチェーンを使用
const userName = user?.profile?.displayName;

// ❌ Bad: ネストした if 文
let userName: string | undefined;
if (user && user.profile && user.profile.displayName) {
  userName = user.profile.displayName;
}
```

### Nullish Coalescing

```typescript
// ✅ Good: Nullish Coalescing を使用
const displayName = user?.displayName ?? 'Anonymous';

// ❌ Bad: || 演算子（0 や '' も falsy として扱われる）
const count = value || 0; // value が 0 の場合も 0 になる（意図通りだが）
```

---

## 型定義ファイル

### 型定義の配置

- プロジェクト固有の型：`src/types/` 配下
- コンポーネント固有の型：コンポーネントファイル内
- 共通型：`src/types/common.ts`

### Supabase の型生成

```bash
# 型を生成
supabase gen types typescript --project-id "local" > src/types/supabase.ts
```

```typescript
// ✅ Good: Supabase の型を使用
import { Database } from '@/types/supabase';

type Diary = Database['public']['Tables']['t_diaries']['Row'];
```

---

## ベストプラクティス

### 1. 型の明示性

- 公開APIの型は明示的に定義
- 内部実装では型推論を活用

### 2. 型の再利用

- 共通の型は型定義ファイルに集約
- 重複する型定義を避ける

### 3. 型の拡張性

- 将来の拡張を考慮した型設計
- `interface` は拡張可能に設計

### 4. 型のドキュメント

- 複雑な型にはコメントを追加
- JSDoc で型の説明を記述

---

**関連ドキュメント:**
- [コーディング規約（概要）](./301_CodingStandards.md)
- [命名規則・ファイル構造](./303_NamingConventions.md)
- [ドキュメントコメント規約](./310_Documentation.md)

