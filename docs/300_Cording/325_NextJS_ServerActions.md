# 詳細設計書：Server Actions

## Server Actions

Next.js 16 の **Server Actions** を活用した実装方針を定めます。Server Actions により、API Route を経由せずにサーバー関数を直接呼び出せます。

---

## 1. Server Actions の概要

### 利点

- **API Route の削減**：専用の API Route が不要
- **型安全性**：TypeScript の型推論が効く
- **自動的な再検証**：`revalidatePath` / `revalidateTag` と統合
- **プログレッシブエンハンスメント**：JavaScript が無効でも動作

### 使用方針

**Server Actions を使用する場合：**
- フォーム送信
- データの作成・更新・削除
- 認証が必要な操作

**API Route を使用する場合：**
- 外部 API のプロキシ
- Webhook の受信
- ファイルアップロード（大きなファイル）

---

## 2. Server Actions の実装

### 基本パターン

**実装場所：** `src/app/actions/diary.ts`

```typescript
'use server';

import { createSupabaseServerClient } from '@/lib/supabase';
import { revalidateTag } from 'next/cache';
import { createDiaryFormSchema } from '@/schemas';

export async function createDiary(formData: FormData) {
  // 認証チェック
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('認証が必要です');
  }
  
  // バリデーション
  const data = {
    journal_date: formData.get('journal_date') as string,
    note: formData.get('note') as string,
    // ...
  };
  
  const validated = createDiaryFormSchema.parse(data);
  
  // データベースに保存
  const { error } = await supabase
    .from('t_diaries')
    .insert({
      ...validated,
      user_id: user.id,
    });
  
  if (error) {
    throw new Error('日記の作成に失敗しました');
  }
  
  // キャッシュを無効化
  revalidateTag('diaries');
}
```

### 型安全な Server Action

```typescript
'use server';

import { updateDiaryFormSchema, type UpdateDiaryFormInput } from '@/schemas';

export async function updateDiary(input: UpdateDiaryFormInput) {
  const validated = updateDiaryFormSchema.parse(input);
  // ...
}
```

---

## 3. フォーム処理での活用

### フォームコンポーネント

```typescript
'use client';

import { createDiary } from '@/app/actions/diary';
import { useFormState } from 'react-dom';

export function DiaryForm() {
  const [state, formAction] = useFormState(createDiary, null);
  
  return (
    <form action={formAction}>
      <input name="diary_date" type="date" required />
      <textarea name="note" required />
      <button type="submit">保存</button>
      {state?.error && <p className="error">{state.error}</p>}
    </form>
  );
}
```

### プログレッシブエンハンスメント

```typescript
'use client';

import { createDiary } from '@/app/actions/diary';
import { useTransition } from 'react';

export function DiaryForm() {
  const [isPending, startTransition] = useTransition();
  
  const handleSubmit = async (formData: FormData) => {
    startTransition(async () => {
      await createDiary(formData);
    });
  };
  
  return (
    <form action={handleSubmit}>
      {/* フォームフィールド */}
      <button type="submit" disabled={isPending}>
        {isPending ? '保存中...' : '保存'}
      </button>
    </form>
  );
}
```

---

## 4. エラーハンドリング

### エラー返却パターン

```typescript
'use server';

export async function createDiary(formData: FormData) {
  try {
    // 処理
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'エラーが発生しました',
    };
  }
}
```

### エラーを throw するパターン

```typescript
'use client';

import { createDiary } from '@/app/actions/diary';

export function DiaryForm() {
  const handleSubmit = async (formData: FormData) => {
    try {
      await createDiary(formData);
      // 成功時の処理
    } catch (error) {
      // エラー処理
      console.error(error);
    }
  };
  
  return <form action={handleSubmit}>...</form>;
}
```

---

## 5. 再検証との統合

### 自動的な再検証

```typescript
'use server';

import { revalidatePath, revalidateTag } from 'next/cache';

export async function updateDiary(id: string, data: DiaryData) {
  // データ更新
  await updateDiaryInDB(id, data);
  
  // パスベースの再検証
  revalidatePath(`/diary/${id}`);
  revalidatePath('/diary'); // 一覧ページ
  
  // タグベースの再検証
  revalidateTag('diaries');
}
```

---

## 6. Server Actions と API Route の使い分け

### Server Actions を使用する場合

- ✅ フォーム送信
- ✅ データの CRUD 操作
- ✅ 認証が必要な操作
- ✅ キャッシュの再検証が必要な操作

### API Route を使用する場合

- ✅ 外部 API のプロキシ
- ✅ Webhook の受信
- ✅ ファイルアップロード（大きなファイル）
- ✅ ストリーミングレスポンス
- ✅ 認証が不要な公開 API

---

## 7. ベストプラクティス

### 1. バリデーション

- Server Actions 内で必ずバリデーションを実行
- Zod スキーマを使用

### 2. 認証チェック

- すべての Server Actions で認証チェックを実施
- 認証ヘルパー関数を使用

### 3. エラーハンドリング

- 適切なエラーメッセージを返す
- 機密情報をエラーメッセージに含めない

### 4. パフォーマンス

- 重い処理は非同期で実行
- 必要に応じてキューイングを検討

---

**関連ドキュメント:**
- [基本設計書](../100_BasicDesign/100_BasicDesign.md)
- [Next.js 16 実装方針（概要）](./321_NextJS_Implementation_Overview.md)
- [API設計](../202_DetailedDesign/206_DetailedDesign_API.md)
- [認証管理](./324_NextJS_Authentication.md)

