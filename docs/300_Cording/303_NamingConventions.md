# 命名規則・ファイル構造

## 命名規則・ファイル構造

本ドキュメントは、auriary プロジェクトにおける命名規則とファイル構造の規約を定めたものです。

---

## ファイル命名規則

### コンポーネントファイル

- **形式**: `PascalCase.tsx`
- **例**: `DiaryCard.tsx`, `UserProfile.tsx`

```typescript
// ✅ Good
// components/diary/DiaryCard.tsx
export function DiaryCard() {
  // ...
}

// ❌ Bad
// components/diary/diary-card.tsx
// components/diary/diaryCard.tsx
```

### ユーティリティファイル

- **形式**: `camelCase.ts`
- **例**: `formatDate.ts`, `validateInput.ts`

```typescript
// ✅ Good
// lib/utils/formatDate.ts
export function formatDate(date: Date): string {
  // ...
}

// ❌ Bad
// lib/utils/format-date.ts
// lib/utils/FormatDate.ts
```

### フックファイル

- **形式**: `use-*.ts` または `use*.ts`
- **例**: `use-mobile.ts`, `useDiary.ts`

```typescript
// ✅ Good
// hooks/use-mobile.ts
export function useMobile() {
  // ...
}

// hooks/useDiary.ts
export function useDiary() {
  // ...
}
```

### 定数ファイル

- **形式**: `UPPER_SNAKE_CASE.ts` または `constants.ts`
- **例**: `API_ENDPOINTS.ts`, `constants.ts`

```typescript
// ✅ Good
// lib/constants/API_ENDPOINTS.ts
export const API_ENDPOINTS = {
  DIARIES: '/api/diaries',
  USERS: '/api/users',
} as const;

// lib/constants/index.ts
export const MAX_DIARY_LENGTH = 10000;
```

### 型定義ファイル

- **形式**: `*.types.ts` または `types.ts`
- **例**: `diary.types.ts`, `types/supabase.ts`

```typescript
// ✅ Good
// types/diary.types.ts
export interface Diary {
  id: number;
  // ...
}

// types/supabase.ts
export type Database = {
  // ...
};
```

---

## ディレクトリ構造

### プロジェクト構造

```
src/
├── app/                    # Next.js App Router
│   ├── (dashboard)/       # Route Groups
│   ├── diary/             # 日記関連ページ
│   └── api/               # API Routes
├── components/            # React コンポーネント
│   ├── ui/               # shadcn/ui コンポーネント
│   ├── diary/            # 日記関連コンポーネント
│   └── common/           # 共通コンポーネント
├── schemas/              # Zod スキーマ（テーブル・フォーム用）
│   ├── base.ts          # 共通スキーマ
│   ├── tables/          # テーブルスキーマ（DB行用）
│   ├── forms/           # フォームスキーマ（入力・更新用）
│   └── index.ts         # エクスポート集約
├── lib/                  # ユーティリティ・ライブラリ
│   ├── supabase.ts      # Supabase クライアント
│   ├── utils.ts         # ユーティリティ関数
│   └── ai/              # AI 統合ロジック
├── hooks/                # カスタムフック
└── styles/               # スタイルファイル
```

### コンポーネントの配置

```
components/
├── ui/                   # shadcn/ui コンポーネント（自動生成）
├── diary/               # 日記関連コンポーネント
│   ├── DiaryCard.tsx
│   ├── DiaryEditor.tsx
│   └── DiaryList.tsx
└── common/              # 共通コンポーネント
    ├── Header.tsx
    ├── Sidebar.tsx
    └── Footer.tsx
```

### 機能別の配置

```
app/
├── diary/               # 日記機能
│   ├── page.tsx        # 一覧ページ
│   ├── [id]/           # 詳細ページ
│   │   ├── page.tsx
│   │   └── edit/       # 編集ページ
│   └── new/            # 新規作成ページ
└── settings/           # 設定機能
    └── page.tsx
```

---

## 変数・関数の命名規則

### 変数名

- **形式**: `camelCase`
- **例**: `userName`, `diaryList`, `isLoading`

```typescript
// ✅ Good
const userName = 'John Doe';
const diaryList: Diary[] = [];
const isLoading = false;

// ❌ Bad
const user_name = 'John Doe';
const DiaryList: Diary[] = [];
const IS_LOADING = false;
```

### 定数名

- **形式**: `UPPER_SNAKE_CASE`
- **例**: `MAX_DIARY_LENGTH`, `API_BASE_URL`

```typescript
// ✅ Good
const MAX_DIARY_LENGTH = 10000;
const API_BASE_URL = 'https://api.example.com';

// ❌ Bad
const maxDiaryLength = 10000;
const apiBaseUrl = 'https://api.example.com';
```

### 関数名

- **形式**: `camelCase`
- **動詞で始める**: `get`, `set`, `create`, `update`, `delete`, `is`, `has`
- **例**: `getDiaries()`, `createDiary()`, `isValid()`

```typescript
// ✅ Good
function getDiaries(): Promise<Diary[]> {
  // ...
}

function createDiary(data: DiaryData): Promise<Diary> {
  // ...
}

function isValidEmail(email: string): boolean {
  // ...
}

// ❌ Bad
function diaries(): Promise<Diary[]> {
  // ...
}

function diaryCreate(data: DiaryData): Promise<Diary> {
  // ...
}
```

### クラス名

- **形式**: `PascalCase`
- **例**: `DiaryService`, `UserRepository`

```typescript
// ✅ Good
class DiaryService {
  async getDiaries(): Promise<Diary[]> {
    // ...
  }
}

// ❌ Bad
class diaryService {
  // ...
}
```

### インターフェース・型名

- **形式**: `PascalCase`
- **例**: `Diary`, `UserProfile`, `ApiResponse`

```typescript
// ✅ Good
interface Diary {
  id: number;
  // ...
}

type UserProfile = {
  name: string;
  // ...
};

// ❌ Bad
interface diary {
  // ...
}

type userProfile = {
  // ...
};
```

---

## コンポーネントの命名

### コンポーネント名

- **形式**: `PascalCase`
- **ファイル名と一致させる**

```typescript
// ✅ Good
// components/diary/DiaryCard.tsx
export function DiaryCard({ diary }: { diary: Diary }) {
  return <div>...</div>;
}

// ❌ Bad
// components/diary/DiaryCard.tsx
export function Card({ diary }: { diary: Diary }) {
  // ファイル名と一致していない
}
```

### Props の型定義

```typescript
// ✅ Good: Props 型を定義
interface DiaryCardProps {
  diary: Diary;
  onEdit?: (id: number) => void;
}

export function DiaryCard({ diary, onEdit }: DiaryCardProps) {
  // ...
}

// ✅ Good: インライン型定義（シンプルな場合）
export function DiaryCard({ diary }: { diary: Diary }) {
  // ...
}
```

---

## インポートの順序

### インポートのグループ化

```typescript
// 1. React / Next.js
import { useState, useEffect } from 'react';
import { NextRequest } from 'next/server';

// 2. サードパーティライブラリ
import { z } from 'zod';
import { format } from 'date-fns';

// 3. 内部モジュール（絶対パス）
import { createSupabaseServerClient } from '@/lib/supabase';
import { Diary } from '@/types/diary';

// 4. 相対パス
import { DiaryCard } from './DiaryCard';
import { formatDate } from '../utils/formatDate';

// 5. 型のみのインポート
import type { Database } from '@/types/supabase';
```

---

## ファイル拡張子

### TypeScript / React

- `.ts` - TypeScript ファイル（コンポーネント以外）
- `.tsx` - TypeScript + JSX ファイル（コンポーネント）
- `.d.ts` - 型定義ファイル

### その他

- `.css` - CSS ファイル
- `.scss` - SCSS ファイル（使用する場合）
- `.json` - JSON ファイル

---

## ベストプラクティス

### 1. 一貫性の維持

- プロジェクト全体で命名規則を統一
- 既存のコードスタイルに合わせる

### 2. 意味のある名前

- 略語を避ける（`usr` ではなく `user`）
- 意図が明確になるように命名

### 3. 長さのバランス

- 短すぎず、長すぎない名前
- スコープに応じて適切な長さを選択

---

**関連ドキュメント:**
- [コーディング規約（概要）](./301_CodingStandards.md)
- [TypeScript コーディング規約](./302_TypeScript.md)
- [コンポーネント設計原則](./305_ComponentDesign.md)

