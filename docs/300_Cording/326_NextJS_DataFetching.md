# 詳細設計書：データフェッチング

## データフェッチング

Next.js 16 におけるデータフェッチングの方針を定めます。Server Components での直接フェッチ、Streaming、Suspense を活用した効率的なデータ取得を実装します。

---

## 1. Server Components での直接フェッチ

### 基本方針

- Server Components で直接データベースにアクセス
- API Route を経由しない
- `async/await` を直接使用

### 実装例

```typescript
// app/diary/page.tsx
import { createSupabaseServerClient } from '@/lib/supabase';

export default async function DiaryPage() {
  const supabase = await createSupabaseServerClient();
  
  const { data: diaries, error } = await supabase
    .from('t_diaries')
    .select('*')
    .order('diary_date', { ascending: false });
  
  if (error) {
    throw new Error('日記の取得に失敗しました');
  }
  
  return <DiaryList diaries={diaries || []} />;
}
```

---

## 2. Streaming の活用

### Suspense による段階的レンダリング

**使用方針：**
- 複数のデータソースがある場合、それぞれを Suspense で囲む
- 読み込みが早いデータから順に表示

**例：**
```typescript
import { Suspense } from 'react';

export default async function DashboardPage() {
  return (
    <div>
      <Suspense fallback={<DiaryListSkeleton />}>
        <DiaryList />
      </Suspense>
      
      <Suspense fallback={<AnalyticsSkeleton />}>
        <AnalyticsChart />
      </Suspense>
    </div>
  );
}

async function DiaryList() {
  const diaries = await getDiaries();
  return <div>{/* 日記一覧 */}</div>;
}

async function AnalyticsChart() {
  const data = await getAnalyticsData(); // 時間がかかる処理
  return <div>{/* 分析チャート */}</div>;
}
```

---

## 3. 並列データフェッチング

### Promise.all の活用

```typescript
export default async function DiaryDetailPage({ id }: { id: string }) {
  // 並列でデータ取得
  const [diary, attachments, aiAnalysis] = await Promise.all([
    getDiary(id),
    getDiaryAttachments(id),
    getAIAnalysis(id),
  ]);
  
  return (
    <div>
      <DiaryContent diary={diary} />
      <Attachments attachments={attachments} />
      <AIAnalysis analysis={aiAnalysis} />
    </div>
  );
}
```

---

## 4. データフェッチ関数の分離

### 実装パターン

**実装場所：** `src/lib/data/diary.ts`

```typescript
import { createSupabaseServerClient } from '../supabase';

export async function getDiaries(userId: number) {
  const supabase = await createSupabaseServerClient();
  
  const { data, error } = await supabase
    .from('t_diaries')
    .select('*')
    .eq('user_id', userId)
    .order('diary_date', { ascending: false });
  
  if (error) {
    throw new Error('日記の取得に失敗しました');
  }
  
  return data || [];
}

export async function getDiary(id: string) {
  const supabase = await createSupabaseServerClient();
  
  const { data, error } = await supabase
    .from('t_diaries')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    throw new Error('日記の取得に失敗しました');
  }
  
  return data;
}
```

---

## 5. エラーハンドリング

### Error Boundary との組み合わせ

```typescript
// app/diary/error.tsx
'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div>
      <h2>エラーが発生しました</h2>
      <p>{error.message}</p>
      <button onClick={reset}>再試行</button>
    </div>
  );
}
```

### データフェッチ関数でのエラーハンドリング

```typescript
export async function getDiaries(userId: number) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from('t_diaries')
      .select('*')
      .eq('user_id', userId);
    
    if (error) {
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('日記の取得エラー:', error);
    throw new Error('日記の取得に失敗しました');
  }
}
```

---

## 6. ローディング状態

### Loading UI

**実装場所：** `app/diary/loading.tsx`

```typescript
export default function Loading() {
  return (
    <div>
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    </div>
  );
}
```

### Suspense でのローディング

```typescript
import { Suspense } from 'react';

export default function Page() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <DiaryList />
    </Suspense>
  );
}
```

---

## 7. キャッシュとの組み合わせ

### キャッシュ付きデータフェッチ

```typescript
import { unstable_cache } from 'next/cache';

export const getCachedDiaries = unstable_cache(
  async (userId: number) => {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from('t_diaries')
      .select('*')
      .eq('user_id', userId);
    
    return data || [];
  },
  ['diaries'],
  {
    revalidate: 300, // 5分
    tags: ['diaries'],
  }
);
```

---

## 8. ベストプラクティス

### 1. データフェッチの最適化

- 必要なデータのみ取得（`select` でカラム指定）
- ページネーションの実装
- インデックスの活用

### 2. 型安全性

- Supabase の型生成を活用
- TypeScript の型推論を最大限に活用

### 3. パフォーマンス

- 並列フェッチの活用
- Streaming の活用
- キャッシュの適切な使用

---

**関連ドキュメント:**
- [基本設計書](../100_BasicDesign/100_BasicDesign.md)
- [Next.js 16 実装方針（概要）](./321_NextJS_Implementation_Overview.md)
- [キャッシング戦略](./323_NextJS_Caching.md)
- [React Server Components 優先原則](./322_NextJS_ServerComponents.md)

