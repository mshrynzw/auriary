# 詳細設計書：キャッシング戦略

## キャッシング戦略

Next.js 16 では、**Cache Components**（`use cache`）と `unstable_cache` を活用した柔軟なキャッシング戦略が可能です。本プロジェクトでは、パフォーマンスとデータの鮮度のバランスを考慮したキャッシング方針を定めます。

---

## 1. `use cache` ディレクティブ

### 概要

`use cache` は、React 19 で導入された Cache Components の機能です。コンポーネント単位でキャッシュを制御できます。

### 使用方針

**適用箇所：**
- 頻繁にアクセスされるが、更新頻度が低いデータ
- 日記一覧の表示（過去の日記は変更されない）
- ユーザープロフィール情報

**例：**
```typescript
import { cache } from 'react';

export const getCachedUser = cache(async (userId: string) => {
  const supabase = createSupabaseServerClient();
  const { data: user } = await supabase
    .from('m_users')
    .select('*')
    .eq('id', userId)
    .single();
  
  return user;
});

// コンポーネントで使用
export default async function UserProfile({ userId }: { userId: string }) {
  const user = await getCachedUser(userId); // 同じ userId ならキャッシュから取得
  
  return <div>{user?.display_name}</div>;
}
```

---

## 2. `unstable_cache` の活用

### 概要

`unstable_cache` は、Next.js のデータフェッチ関数をキャッシュするための API です。

### 使用方針

**適用箇所：**
- Supabase からのデータ取得
- OpenAI API の呼び出し結果（要約、感情分析など）
- 外部 API の呼び出し

**例：**
```typescript
import { unstable_cache } from 'next/cache';

export const getCachedDiaries = unstable_cache(
  async (userId: number, startDate?: string, endDate?: string) => {
    const supabase = createSupabaseServerClient();
    let query = supabase
      .from('t_diaries')
      .select('*')
      .eq('user_id', userId)
      .order('diary_date', { ascending: false });
    
    if (startDate) {
      query = query.gte('diary_date', startDate);
    }
    if (endDate) {
      query = query.lte('diary_date', endDate);
    }
    
    const { data } = await query;
    return data;
  },
  ['diaries'], // キャッシュキーのプレフィックス
  {
    revalidate: 60, // 60秒で再検証
    tags: ['diaries'], // タグによる無効化
  }
);
```

---

## 3. キャッシュの無効化

### タグベースの無効化

**使用方針：**
- 日記の作成・更新・削除時に `revalidateTag` を使用
- Server Actions でデータ更新後にキャッシュを無効化

**例：**
```typescript
'use server';

import { revalidateTag } from 'next/cache';

export async function createDiary(data: DiaryData) {
  const supabase = createSupabaseServerClient();
  await supabase.from('t_diaries').insert(data);
  
  // キャッシュを無効化
  revalidateTag('diaries');
}
```

### パスベースの無効化

**使用方針：**
- 特定のページのキャッシュを無効化する場合

**例：**
```typescript
import { revalidatePath } from 'next/cache';

export async function updateDiary(id: string, data: DiaryData) {
  // データ更新
  await updateDiaryInDB(id, data);
  
  // 該当ページのキャッシュを無効化
  revalidatePath(`/diary/${id}`);
  revalidatePath('/diary'); // 一覧ページも無効化
}
```

---

## 4. キャッシュ戦略の分類

### 静的コンテンツ（長時間キャッシュ）

- **対象**：ユーザープロフィール、設定情報
- **再検証**：1時間以上
- **無効化**：ユーザーが更新した時のみ

### 準静的コンテンツ（中程度のキャッシュ）

- **対象**：過去の日記一覧、カレンダー表示
- **再検証**：5分〜1時間
- **無効化**：日記の作成・更新時

### 動的コンテンツ（短時間キャッシュ）

- **対象**：AI 分析結果、要約
- **再検証**：1分〜5分
- **無効化**：日記更新時

### リアルタイムコンテンツ（キャッシュなし）

- **対象**：現在編集中の日記、通知
- **再検証**：なし
- **無効化**：常に最新データを取得

---

## 5. 実装例

### 日記一覧のキャッシュ

```typescript
import { unstable_cache } from 'next/cache';

export const getDiaries = unstable_cache(
  async (userId: number) => {
    const supabase = createSupabaseServerClient();
    const { data } = await supabase
      .from('t_diaries')
      .select('*')
      .eq('user_id', userId)
      .order('diary_date', { ascending: false });
    
    return data;
  },
  ['diaries'],
  {
    revalidate: 300, // 5分で再検証
    tags: ['diaries'],
  }
);
```

### AI 分析結果のキャッシュ

```typescript
export const getCachedAIAnalysis = unstable_cache(
  async (diaryId: number) => {
    // OpenAI API を呼び出し
    const analysis = await analyzeDiary(diaryId);
    return analysis;
  },
  ['ai-analysis'],
  {
    revalidate: 3600, // 1時間で再検証（AI 分析は高コストのため）
    tags: ['ai-analysis'],
  }
);
```

---

## 6. 注意事項

### 1. キャッシュキーの設計

- ユーザーごとに異なるキャッシュが必要な場合は、`userId` をキーに含める
- 日付範囲など、クエリパラメータをキーに含める

### 2. メモリ使用量

- キャッシュはメモリに保存されるため、過度なキャッシュは避ける
- 必要に応じて `revalidate` を短く設定

### 3. データの整合性

- 重要なデータ更新時は必ずキャッシュを無効化
- Server Actions でデータ更新後、即座に `revalidateTag` を呼び出す

---

**関連ドキュメント:**
- [基本設計書](./100_BasicDesign.md)
- [Next.js 16 実装方針（概要）](./211_NextJS_Implementation_Overview.md)
- [データフェッチング](./226_NextJS_DataFetching.md)

