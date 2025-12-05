# スキーマ設計

## 概要

本ドキュメントは、auriary プロジェクトにおける Zod スキーマの設計原則と実装方針を定めたものです。

スキーマは `src/schemas/` 配下に配置され、型安全性の確保、バリデーション、型定義の一元管理を目的としています。

---

## スキーマ設計の目的

1. **型安全性の確保**: Zod スキーマから TypeScript の型を自動生成
2. **バリデーションの一元管理**: フォーム入力・API リクエストのバリデーションを統一
3. **保守性の向上**: スキーマの変更が型定義に自動反映される
4. **再利用性**: 共通スキーマを `base.ts` で定義し、各スキーマで再利用

---

## ディレクトリ構造

```
src/schemas/
├── base.ts                    # 共通スキーマ（共通カラム、レベル値など）
├── index.ts                   # エクスポート集約
├── tables/                    # テーブルスキーマ（DB行用）
│   ├── m_users.ts
│   ├── m_user_daily_defaults.ts
│   ├── t_diaries.ts
│   ├── t_diary_attachments.ts
│   ├── m_medications.ts
│   ├── r_user_medications.ts
│   ├── r_user_ext_accounts.ts
│   ├── t_overdoses.ts
│   └── t_medication_intakes.ts
└── forms/                     # フォームスキーマ（入力・更新用）
    ├── diary-form.ts
    ├── auth-form.ts
    └── settings-form.ts
```

---

## スキーマの種類

### 1. テーブルスキーマ（`tables/`）

データベーステーブルに対応するスキーマ。Supabase から取得した生データの検証と型定義に使用します。

**特徴:**
- データベースのカラム定義と一致
- `commonColumnsSchema` を継承
- `Row` 型と `Schema` 型を分離（必要に応じて `transform` を使用）

**例:**

```typescript
// src/schemas/tables/t_diaries.ts
import { z } from 'zod';
import { commonColumnsSchema, userIdSchema, levelSchema, moodSchema } from '../base';

/**
 * t_diaries（日記・日次記録）のデータベース行スキーマ
 * Supabaseから取得した生データ用
 */
export const diaryRowSchema = commonColumnsSchema.extend({
  user_id: userIdSchema,
  journal_date: z.string().date(),
  sleep_start_at: z.string().datetime().nullable(),
  sleep_end_at: z.string().datetime().nullable(),
  bath_start_at: z.string().datetime().nullable(),
  bath_end_at: z.string().datetime().nullable(),
  sleep_quality: levelSchema.nullable(),
  wake_level: levelSchema.nullable(),
  daytime_level: levelSchema.nullable(),
  pre_sleep_level: levelSchema.nullable(),
  med_adherence_level: levelSchema.nullable(),
  appetite_level: levelSchema.nullable(),
  sleep_desire_level: levelSchema.nullable(),
  note: z.string().nullable(),
  has_od: z.boolean().nullable(),
  ai_summary: z.string().nullable(),
  ai_topics: z.record(z.any()).nullable(), // JSONB
  mood: moodSchema.nullable(),
});

/**
 * t_diaries（日記・日次記録）のアプリケーション用スキーマ
 * Dateオブジェクトに変換
 */
export const diarySchema = diaryRowSchema.transform((data) => ({
  ...data,
  journal_date: new Date(data.journal_date),
  sleep_start_at: data.sleep_start_at ? new Date(data.sleep_start_at) : null,
  sleep_end_at: data.sleep_end_at ? new Date(data.sleep_end_at) : null,
  bath_start_at: data.bath_start_at ? new Date(data.bath_start_at) : null,
  bath_end_at: data.bath_end_at ? new Date(data.bath_end_at) : null,
}));

export type Diary = z.infer<typeof diarySchema>;
export type DiaryRow = z.infer<typeof diaryRowSchema>;
```

**使い分け:**
- `DiaryRow`: Supabase から取得した生データ（文字列の日付・日時）
- `Diary`: アプリケーション内で使用するデータ（Date オブジェクト）

### 2. フォームスキーマ（`forms/`）

フォーム入力・更新用のスキーマ。ユーザー入力のバリデーションに使用します。

**特徴:**
- フォーム入力に必要なフィールドのみを含む
- オプショナルフィールドが多い
- `create` と `update` スキーマを分離（`update` は `create` の `.partial()`）

**例:**

```typescript
// src/schemas/forms/diary-form.ts
import { z } from 'zod';

// 作成用スキーマ
export const createDiaryFormSchema = z.object({
  journal_date: z.string().date('有効な日付を入力してください'), // ISO8601 date string (e.g. "2025-01-10")
  note: z.string().max(10000, '日記本文は10000文字以下である必要があります').optional(),
  sleep_quality: z.number().min(0).max(10).optional(),
  wake_level: z.number().min(0).max(10).optional(),
  daytime_level: z.number().min(0).max(10).optional(),
  pre_sleep_level: z.number().min(0).max(10).optional(),
  med_adherence_level: z.number().min(0).max(10).optional(),
  appetite_level: z.number().min(0).max(10).optional(),
  sleep_desire_level: z.number().min(0).max(10).optional(),
  exercise_level: z.number().min(0).max(10).optional(),
  has_od: z.boolean().optional(),
  // datetime-local入力はブラウザが自動的に正しい形式を強制するため、バリデーション不要
  sleep_start_at: z.string().optional(),
  sleep_end_at: z.string().optional(),
  bath_start_at: z.string().optional(),
  bath_end_at: z.string().optional(),
});

// 更新用スキーマ（すべてオプショナル）
export const updateDiaryFormSchema = createDiaryFormSchema.partial();

export type CreateDiaryFormInput = z.infer<typeof createDiaryFormSchema>;
export type UpdateDiaryFormInput = z.infer<typeof updateDiaryFormSchema>;
```

### 3. 共通スキーマ（`base.ts`）

複数のスキーマで再利用される共通のスキーマ定義。

**内容:**
- 共通カラム（`id`, `created_at`, `updated_at` など）
- Brand 型（`UserId`, `DiaryId` など）
- レベル値スキーマ（`levelSchema`: 0-10, `moodSchema`: 1-10）
- 日付・日時・時刻文字列スキーマ

**例:**

```typescript
// src/schemas/base.ts
import { z } from 'zod';

/**
 * 共通カラムのスキーマ
 * すべてのテーブルに共通するカラムを定義
 */
export const commonColumnsSchema = z.object({
  id: z.number().int().positive(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  deleted_at: z.string().datetime().nullable(),
  created_by: z.string().uuid(),
  updated_by: z.string().uuid(),
  deleted_by: z.string().uuid().nullable(),
  source_id: z.number().int().positive().nullable(),
});

/**
 * 型の区別（Brand型）
 * 異なるID型を区別するために使用
 */
export const userIdSchema = z.number().int().positive().brand<'UserId'>();
export const diaryIdSchema = z.number().int().positive().brand<'DiaryId'>();

/**
 * レベル値の共通スキーマ（0-10の範囲）
 */
export const levelSchema = z.number().int().min(0).max(10);

/**
 * レベル値の共通スキーマ（1-10の範囲）
 */
export const moodSchema = z.number().int().min(1).max(10);

/**
 * 日付文字列スキーマ（ISO8601 date string）
 */
export const dateStringSchema = z.string().date();

/**
 * 日時文字列スキーマ（ISO8601 datetime string）
 */
export const datetimeStringSchema = z.string().datetime();

/**
 * 時刻文字列スキーマ（HH:mm形式）
 * 空文字列をnullに変換し、HH:mm形式を検証
 */
export const timeStringSchema = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((val) => (val === '' || val === null || val === undefined ? null : val))
  .refine(
    (val) => {
      if (val === null) return true;
      return /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/.test(val);
    },
    {
      message: '時刻はHH:mm形式で入力してください（例: 21:00）',
    },
  )
  .nullable()
  .optional();
```

---

## Zod v4 の活用

### 1. Brand 型（`.brand()`）

異なる ID 型を区別するために使用します。

```typescript
const userIdSchema = z.number().int().positive().brand<'UserId'>();
const diaryIdSchema = z.number().int().positive().brand<'DiaryId'>();

// 型エラー: userId と diaryId は異なる型として扱われる
function getDiary(userId: z.infer<typeof userIdSchema>, diaryId: z.infer<typeof diaryIdSchema>) {
  // ...
}
```

### 2. Transform（`.transform()`）

データベースの文字列をアプリケーションの Date オブジェクトに変換します。

```typescript
export const diarySchema = diaryRowSchema.transform((data) => ({
  ...data,
  journal_date: new Date(data.journal_date),
}));
```

### 3. Refine（`.refine()`）

複雑なバリデーションロジックを実装します。

```typescript
export const timeStringSchema = z
  .string()
  .refine(
    (val) => /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/.test(val),
    { message: '時刻はHH:mm形式で入力してください' }
  );
```

### 4. Union（`.union()`）

複数の型を許可します。

```typescript
export const timeStringSchema = z.union([
  z.string(),
  z.null(),
  z.undefined(),
]);
```

---

## 使用方法

### 1. Server Actions での使用

```typescript
// src/app/actions/diary.ts
'use server';

import { createDiaryFormSchema, type CreateDiaryFormInput } from '@/schemas';

export async function createDiaryAction(input: CreateDiaryFormInput) {
  // バリデーション
  const validated = createDiaryFormSchema.parse(input);
  
  // データベースに保存
  // ...
}
```

### 2. React Hook Form での使用

```typescript
// src/app/diary/diary-editor.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createDiaryFormSchema, type CreateDiaryFormInput } from '@/schemas';

export function DiaryEditor() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateDiaryFormInput>({
    resolver: zodResolver(createDiaryFormSchema),
  });
  
  // ...
}
```

### 3. 型定義としての使用

```typescript
import { DiaryRow, Diary, type CreateDiaryFormInput } from '@/schemas';

// Supabase から取得したデータ
const diary: DiaryRow = await supabase.from('t_diaries').select('*').single();

// フォーム入力データ
function handleSubmit(data: CreateDiaryFormInput) {
  // ...
}
```

---

## ベストプラクティス

### 1. スキーマの命名規則

- **テーブルスキーマ**: `<tableName>RowSchema`, `<tableName>Schema`
- **フォームスキーマ**: `<entity>FormSchema`（例: `createDiaryFormSchema`, `updateDiaryFormSchema`）
- **型**: `<Entity>Row`, `<Entity>`, `<CreateEntity>FormInput`, `<UpdateEntity>FormInput`

### 2. スキーマの分離

- **テーブルスキーマ**: データベースの構造を反映
- **フォームスキーマ**: ユーザー入力に最適化
- **共通スキーマ**: 再利用可能な定義を集約

### 3. 型の生成

- `z.infer<typeof schema>` を使用して型を生成
- 型はスキーマファイル内でエクスポート
- `index.ts` で型も再エクスポート

### 4. バリデーションメッセージ

- エラーメッセージは日本語で記述
- ユーザーに分かりやすいメッセージを提供
- フォームスキーマには必ずエラーメッセージを設定

### 5. オプショナルフィールド

- データベースで `nullable` のフィールドは `.nullable()` を使用
- フォームで任意入力のフィールドは `.optional()` を使用
- 両方の場合は `.nullable().optional()` を使用

---

## テスト

スキーマのテストは `src/__tests__/unit/schemas/` 配下に配置します。

```typescript
// src/__tests__/unit/schemas/diary-form.test.ts
import { describe, it, expect } from 'vitest';
import { createDiaryFormSchema } from '@/schemas';

describe('createDiaryFormSchema', () => {
  it('有効な日記データを検証する', () => {
    const data = {
      journal_date: '2025-01-10',
      note: 'Test note',
    };
    expect(createDiaryFormSchema.parse(data)).toEqual(data);
  });

  it('無効な日付形式を拒否する', () => {
    const data = {
      journal_date: 'invalid-date',
      note: 'Test note',
    };
    expect(() => createDiaryFormSchema.parse(data)).toThrow();
  });
});
```

詳細は [単体テスト戦略](../500_Unit_Test/500_Strategy.md) を参照してください。

---

## 関連ドキュメント

- [TypeScript コーディング規約](./302_TypeScript.md)
- [命名規則・ファイル構造](./303_NamingConventions.md)
- [API設計](../202_DetailedDesign/206_DetailedDesign_API.md)
- [単体テスト戦略](../500_Unit_Test/500_Strategy.md)

