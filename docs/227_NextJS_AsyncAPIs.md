# 詳細設計書：非同期 API の活用

## 非同期 API の活用

Next.js 16 では、`cookies()`, `headers()`, `searchParams` などの API が完全に非同期化され、型安全性が向上しました。本プロジェクトでの活用方針を定めます。

---

## 1. 非同期 API の概要

### Next.js 16 での変更点

**Next.js 15 以前：**
```typescript
import { cookies, headers } from 'next/headers';

export function getServerData() {
  const cookieStore = cookies(); // 同期的
  const headersList = headers(); // 同期的
}
```

**Next.js 16：**
```typescript
import { cookies, headers } from 'next/headers';

export async function getServerData() {
  const cookieStore = await cookies(); // 非同期
  const headersList = await headers(); // 非同期
}
```

### 利点

- **型安全性の向上**：より正確な型推論
- **パフォーマンス向上**：非同期処理の最適化
- **一貫性**：すべての API が非同期に統一

---

## 2. `cookies()` の活用

### 基本使用法

```typescript
import { cookies } from 'next/headers';

export async function getCookieValue(name: string) {
  const cookieStore = await cookies();
  return cookieStore.get(name)?.value;
}

export async function setCookie(name: string, value: string) {
  const cookieStore = await cookies();
  cookieStore.set(name, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 7, // 7日
  });
}
```

### Supabase クライアントでの使用

```typescript
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export async function createSupabaseServerClient() {
  const cookieStore = await cookies(); // 非同期
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: '', ...options });
        },
      },
    },
  );
}
```

---

## 3. `headers()` の活用

### リクエストヘッダーの取得

```typescript
import { headers } from 'next/headers';

export async function getRequestHeaders() {
  const headersList = await headers();
  
  return {
    userAgent: headersList.get('user-agent'),
    referer: headersList.get('referer'),
    host: headersList.get('host'),
  };
}
```

### 認証トークンの取得

```typescript
import { headers } from 'next/headers';

export async function getAuthToken() {
  const headersList = await headers();
  const authHeader = headersList.get('authorization');
  
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }
  
  return authHeader.substring(7);
}
```

---

## 4. `searchParams` の活用

### クエリパラメータの取得

```typescript
// app/diary/page.tsx
export default async function DiaryPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams; // 非同期
  const page = params.page ? Number(params.page) : 1;
  const limit = params.limit ? Number(params.limit) : 20;
  
  const diaries = await getDiaries({ page, limit });
  
  return <DiaryList diaries={diaries} />;
}
```

### 型安全なクエリパラメータ

```typescript
import { z } from 'zod';

const searchParamsSchema = z.object({
  page: z.string().optional().transform(Number),
  limit: z.string().optional().transform(Number),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export default async function DiaryPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const validated = searchParamsSchema.parse(params);
  
  const diaries = await getDiaries(validated);
  
  return <DiaryList diaries={diaries} />;
}
```

---

## 5. 並列での非同期 API 呼び出し

### Promise.all の活用

```typescript
import { cookies, headers } from 'next/headers';

export async function getServerContext() {
  const [cookieStore, headersList] = await Promise.all([
    cookies(),
    headers(),
  ]);
  
  return {
    cookies: cookieStore,
    headers: headersList,
  };
}
```

---

## 6. エラーハンドリング

### 非同期 API のエラーハンドリング

```typescript
import { cookies } from 'next/headers';

export async function getCookieSafely(name: string) {
  try {
    const cookieStore = await cookies();
    return cookieStore.get(name)?.value;
  } catch (error) {
    console.error('Cookie の取得エラー:', error);
    return null;
  }
}
```

---

## 7. 型安全性の向上

### 型定義の活用

```typescript
import { cookies } from 'next/headers';

type CookieValue = string | undefined;

export async function getTypedCookie(
  name: string
): Promise<CookieValue> {
  const cookieStore = await cookies();
  return cookieStore.get(name)?.value;
}
```

---

## 8. ベストプラクティス

### 1. 常に await を使用

- `cookies()`, `headers()`, `searchParams` は必ず `await` を使用
- 非同期関数内で呼び出す

### 2. 並列処理の活用

- 複数の非同期 API を呼び出す場合は `Promise.all` を使用

### 3. 型安全性

- TypeScript の型推論を最大限に活用
- Zod スキーマでバリデーション

### 4. エラーハンドリング

- 適切なエラーハンドリングを実装
- デフォルト値の設定

---

**関連ドキュメント:**
- [基本設計書](./100_BasicDesign.md)
- [Next.js 16 実装方針（概要）](./211_NextJS_Implementation_Overview.md)
- [認証管理](./224_NextJS_Authentication.md)
- [データフェッチング](./226_NextJS_DataFetching.md)

