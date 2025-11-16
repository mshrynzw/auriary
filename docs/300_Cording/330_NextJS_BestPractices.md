# 詳細設計書：その他のベストプラクティス

## 10. その他のベストプラクティス

Next.js 16 におけるその他のベストプラクティスを定めます。Metadata API、Route Handlers、Middleware の活用など、実装時の注意点をまとめます。

---

## 10.1 Metadata API

### 動的メタデータ

```typescript
// app/diary/[id]/page.tsx
import { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const diary = await getDiary(id);
  
  return {
    title: diary?.title || '日記',
    description: diary?.note?.substring(0, 160) || '日記の詳細',
    openGraph: {
      title: diary?.title,
      description: diary?.note?.substring(0, 160),
    },
  };
}
```

### 静的メタデータ

```typescript
// app/layout.tsx
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    default: 'auriary',
    template: '%s | auriary',
  },
  description: 'AI と連携した日記アプリ',
  keywords: ['日記', 'AI', '日記アプリ'],
};
```

---

## 10.2 Route Handlers の使い分け

### Server Actions との使い分け

**Server Actions を使用する場合：**
- フォーム送信
- データの CRUD 操作
- 認証が必要な操作

**Route Handlers を使用する場合：**
- 外部 API のプロキシ
- Webhook の受信
- ファイルアップロード（大きなファイル）
- ストリーミングレスポンス

### Route Handler の実装例

```typescript
// app/api/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const body = await request.json();
  
  // Webhook の処理
  await processWebhook(body);
  
  return NextResponse.json({ success: true });
}
```

---

## 10.3 Middleware の活用

### 認証ガード

```typescript
// src/middleware.ts
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // 認証チェック
  const supabase = createServerClient(/* ... */);
  const { data: { user } } = await supabase.auth.getUser();
  
  // ルート保護
  if (request.nextUrl.pathname.startsWith('/diary') && !user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  return NextResponse.next();
}
```

### リクエストの書き換え

```typescript
export async function middleware(request: NextRequest) {
  // リクエストヘッダーの追加
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', request.nextUrl.pathname);
  
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}
```

---

## 10.4 環境変数の管理

### 環境変数の定義

**.env.local:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx
OPENAI_API_KEY=xxx
```

### 環境変数の使用

```typescript
// Server Component / Server Action
const apiKey = process.env.OPENAI_API_KEY; // サーバー側のみ

// Client Component
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL; // クライアント側にも公開
```

### 型安全性

**env.d.ts:**
```typescript
declare namespace NodeJS {
  interface ProcessEnv {
    NEXT_PUBLIC_SUPABASE_URL: string;
    NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
    SUPABASE_SERVICE_ROLE_KEY: string;
    OPENAI_API_KEY: string;
  }
}
```

---

## 10.5 型安全性の確保

### Supabase の型生成

```bash
supabase gen types typescript --project-id "local" > src/types/supabase.ts
```

### 型の使用

```typescript
import { Database } from '@/types/supabase';

type Diary = Database['public']['Tables']['t_diaries']['Row'];
```

---

## 10.6 開発体験の向上

### ホットリロード

- Next.js 16 の Turbopack による高速な開発体験
- ファイル変更時の自動リロード

### デバッグ

- React DevTools の活用
- Next.js の開発モードでの詳細なエラーメッセージ

---

## 10.7 セキュリティ

### セキュリティヘッダー

**next.config.ts:**
```typescript
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
    ];
  },
};
```

### CSRF 対策

- SameSite Cookie の設定
- Server Actions の使用（自動的な CSRF 対策）

---

## 10.8 テスト戦略（将来実装）

### ユニットテスト

- React Testing Library の使用
- Server Components のテスト

### E2E テスト

- Playwright の使用
- 主要なユーザーフローのテスト

---

## 10.9 ドキュメント

### コードコメント

- 複雑なロジックにはコメントを追加
- JSDoc コメントの活用

### README

- プロジェクトの概要
- セットアップ手順
- 開発ガイドライン

---

## 10.10 パフォーマンス監視（将来実装）

### Web Vitals

- Core Web Vitals の監視
- 本番環境でのパフォーマンス測定

### エラー追跡

- Sentry などのエラー追跡サービスの統合
- エラーの自動通知

---

**関連ドキュメント:**
- [基本設計書](../100_BasicDesign/100_BasicDesign.md)
- [Next.js 16 実装方針（概要）](./321_NextJS_Implementation_Overview.md)
- [セキュリティ設計](../202_DetailedDesign/208_DetailedDesign_Security.md)
- [非機能要件](../202_DetailedDesign/210_DetailedDesign_NonFunctional.md)

