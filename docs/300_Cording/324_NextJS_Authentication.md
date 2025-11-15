# 詳細設計書：認証管理

## 認証管理

Next.js 16 と Supabase Auth を統合した認証管理の方針を定めます。Server Components、Middleware、Server Actions を活用したセキュアな認証フローを実装します。

---

## 1. 認証アーキテクチャ

### 構成要素

- **Supabase Auth**：認証プロバイダー
- **@supabase/ssr**：サーバーサイドでのセッション管理
- **Middleware**：ルート保護
- **Server Components**：認証状態の取得

### フロー

```
1. ユーザーがログイン
   ↓
2. Supabase Auth で認証
   ↓
3. Cookie にセッション保存（@supabase/ssr）
   ↓
4. Middleware でセッション検証
   ↓
5. Server Components で認証状態取得
```

---

## 2. Server Components での認証

### セッション取得

**実装場所：** `src/lib/supabase.ts`

```typescript
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export async function createSupabaseServerClient() {
  const cookieStore = await cookies(); // Next.js 16 では非同期
  
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

### 認証チェックパターン

#### パターン 1: ページ全体で認証必須

```typescript
// app/diary/page.tsx
import { createSupabaseServerClient } from '@/lib/supabase';
import { redirect } from 'next/navigation';

export default async function DiaryPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    redirect('/login');
  }
  
  // 認証済みユーザーのみ処理続行
  const diaries = await getDiaries(user.id);
  
  return <DiaryList diaries={diaries} />;
}
```

#### パターン 2: 条件付きレンダリング

```typescript
// app/page.tsx
import { createSupabaseServerClient } from '@/lib/supabase';

export default async function HomePage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (user) {
    return <Dashboard user={user} />;
  }
  
  return <LandingPage />;
}
```

#### パターン 3: 認証ヘルパー関数

```typescript
// src/lib/auth.ts
import { createSupabaseServerClient } from './supabase';
import { redirect } from 'next/navigation';

export async function requireAuth() {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    redirect('/login');
  }
  
  return { user, supabase };
}

// 使用例
export default async function ProtectedPage() {
  const { user, supabase } = await requireAuth();
  // 認証済みユーザーのみ処理続行
}
```

---

## 3. Middleware での認証ガード

### 実装

**実装場所：** `src/middleware.ts`

```typescript
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          request.cookies.set({ name, value: '', ...options });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();

  // 保護されたルート
  if (request.nextUrl.pathname.startsWith('/diary') && !user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // 認証済みユーザーがログインページにアクセス
  if (request.nextUrl.pathname.startsWith('/login') && user) {
    return NextResponse.redirect(new URL('/diary', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
```

### ルート保護の設定

**保護が必要なルート：**
- `/diary/*`：日記関連ページ
- `/settings`：設定ページ
- `/analytics`：分析ページ

**公開ルート：**
- `/`：トップページ
- `/login`：ログインページ
- `/register`：登録ページ

---

## 4. Server Actions での認証

### 認証チェック付き Server Action

```typescript
'use server';

import { createSupabaseServerClient } from '@/lib/supabase';
import { revalidateTag } from 'next/cache';

export async function createDiary(data: DiaryData) {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    throw new Error('認証が必要です');
  }
  
  // 認証済みユーザーのみ処理続行
  const { error: insertError } = await supabase
    .from('t_diaries')
    .insert({
      ...data,
      user_id: user.id,
    });
  
  if (insertError) {
    throw new Error('日記の作成に失敗しました');
  }
  
  revalidateTag('diaries');
}
```

---

## 5. セッション管理

### Cookie 設定

**セキュリティ設定：**
- `HttpOnly`：JavaScript からアクセス不可（XSS 対策）
- `Secure`：HTTPS のみ（本番環境）
- `SameSite=Strict`：CSRF 対策

**設定例：**
```typescript
{
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 60 * 60 * 24 * 7, // 7日
  path: '/',
}
```

### セッション更新

- Supabase Auth が自動的にセッションを更新
- `@supabase/ssr` が Cookie の更新を処理

---

## 6. ログアウト処理

### Server Action でのログアウト

```typescript
'use server';

import { createSupabaseServerClient } from '@/lib/supabase';
import { redirect } from 'next/navigation';

export async function logout() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect('/login');
}
```

---

## 7. エラーハンドリング

### 認証エラーの処理

```typescript
export async function requireAuth() {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error) {
    // セッションが無効な場合
    redirect('/login?error=session_expired');
  }
  
  if (!user) {
    redirect('/login');
  }
  
  return { user, supabase };
}
```

---

## 8. ベストプラクティス

### 1. 認証チェックの重複を避ける

- Middleware でルート保護
- Server Components で認証状態取得
- Server Actions で認証チェック（二重チェック）

### 2. セッションの有効期限

- Supabase Auth のデフォルト設定を使用
- 必要に応じてカスタマイズ

### 3. セキュリティヘッダー

- Middleware でセキュリティヘッダーを設定
- CSP（Content Security Policy）の設定

---

**関連ドキュメント:**
- [基本設計書](../100_BasicDesign/100_BasicDesign.md)
- [Next.js 16 実装方針（概要）](./321_NextJS_Implementation_Overview.md)
- [セキュリティ設計](../202_DetailedDesign/208_DetailedDesign_08_Security.md)
- [機能設計（認証）](../202_DetailedDesign/204_DetailedDesign_Functions.md#41-認証)

