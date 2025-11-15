# 詳細設計書：パフォーマンス最適化

## パフォーマンス最適化

Next.js 16 の機能を活用したパフォーマンス最適化の方針を定めます。Partial Prerendering、Image Optimization、Font Optimization などを実装します。

---

## 1. Partial Prerendering（将来実装）

### 概要

Partial Prerendering（PPR）は、静的コンテンツと動的コンテンツを組み合わせて、高速なページ遷移を実現する機能です。

### 実装方針（将来）

```typescript
// app/diary/page.tsx
export const experimental_ppr = true; // 将来実装

export default async function DiaryPage() {
  // 静的コンテンツ
  const staticContent = await getStaticContent();
  
  // 動的コンテンツ（Suspense で囲む）
  return (
    <div>
      <StaticHeader />
      <Suspense fallback={<DiaryListSkeleton />}>
        <DiaryList />
      </Suspense>
    </div>
  );
}
```

---

## 2. Image Optimization

### Next.js Image コンポーネントの使用

```typescript
import Image from 'next/image';

export function DiaryImage({ src, alt }: { src: string; alt: string }) {
  return (
    <Image
      src={src}
      alt={alt}
      width={800}
      height={600}
      loading="lazy"
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,..."
    />
  );
}
```

### 最適化設定

**next.config.ts:**
```typescript
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};
```

---

## 3. Font Optimization

### Next.js Font の使用

```typescript
// app/layout.tsx
import { Geist, Geist_Mono } from 'next/font/google';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  display: 'swap',
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {children}
      </body>
    </html>
  );
}
```

---

## 4. コード分割

### 動的インポート

```typescript
'use client';

import dynamic from 'next/dynamic';

// 重いコンポーネントを動的インポート
const Chart = dynamic(() => import('@/components/Chart'), {
  loading: () => <ChartSkeleton />,
  ssr: false, // クライアント側のみレンダリング
});

export function AnalyticsPage() {
  return <Chart />;
}
```

---

## 5. バンドルサイズの最適化

### Tree Shaking

- 使用していないコードを自動的に削除
- 必要な部分のみインポート

```typescript
// ❌ Bad: 全体をインポート
import * as lodash from 'lodash';

// ✅ Good: 必要な部分のみインポート
import debounce from 'lodash/debounce';
```

### 外部ライブラリの最適化

- 軽量な代替ライブラリを検討
- 必要な機能のみ使用

---

## 6. キャッシング戦略

### 静的アセットのキャッシュ

**next.config.ts:**
```typescript
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*.{jpg,jpeg,png,svg,gif,webp}',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};
```

### データのキャッシュ

- `unstable_cache` の活用
- `use cache` ディレクティブの使用
- 適切な `revalidate` 設定

---

## 7. レンダリング最適化

### Server Components の活用

- デフォルトで Server Components を使用
- クライアント側の JavaScript を削減

### Streaming の活用

- Suspense による段階的レンダリング
- 読み込みが早いデータから順に表示

---

## 8. パフォーマンス目標

### 目標値

- **初回ロード時間**: 2秒以内
- **ページ遷移**: 500ms 以内
- **API レスポンス**: 1秒以内
- **Lighthouse スコア**: 90以上

### 測定方法

- Lighthouse による測定
- Web Vitals の監視
- 本番環境でのパフォーマンス監視（将来実装）

---

## 9. ベストプラクティス

### 1. 画像最適化

- Next.js Image コンポーネントを使用
- 適切なサイズとフォーマット（WebP など）
- 遅延読み込みの活用

### 2. フォント最適化

- Next.js Font を使用
- `display: 'swap'` を設定
- 必要なサブセットのみ読み込み

### 3. コード分割

- 動的インポートの活用
- ルートベースのコード分割

### 4. キャッシング

- 静的アセットの長期キャッシュ
- データの適切なキャッシュ

---

**関連ドキュメント:**
- [基本設計書](./100_BasicDesign.md)
- [Next.js 16 実装方針（概要）](./211_NextJS_Implementation_Overview.md)
- [キャッシング戦略](./223_NextJS_Caching.md)
- [非機能要件](./210_DetailedDesign_NonFunctional.md)

