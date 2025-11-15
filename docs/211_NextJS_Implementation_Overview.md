# 詳細設計書：Next.js 16 実装方針（概要）

## 概要

本ドキュメントは、auriary プロジェクトにおける **Next.js 16** の実装方針を定めたものです。

Next.js 16 の新機能とベストプラクティスを最大限に活用し、パフォーマンス、保守性、開発効率を向上させることを目的とします。

---

## Next.js 16 の採用理由

- **React Server Components** によるサーバーサイドレンダリングの最適化
- **Cache Components**（`use cache`）による部分的なキャッシュ制御
- **Server Actions** による API レスポンスの削減
- **Partial Prerendering**（将来実装）による高速なページ遷移
- **非同期 API** による型安全性の向上
- **Turbopack** による高速な開発体験

---

## 本プロジェクトでの活用方針

### 基本原則

1. **Server Components をデフォルトで使用**
   - クライアント側のインタラクションが必要な場合のみ `'use client'` を使用

2. **Islands Architecture の適用**
   - インタラクティブな部分のみを Client Component として分離
   - ページ全体を Client Component にしない

3. **キャッシング戦略の明確化**
   - `use cache` ディレクティブによる部分的なキャッシュ
   - `unstable_cache` によるデータフェッチのキャッシュ

4. **認証管理の統一**
   - Server Components での認証チェック
   - Middleware でのルート保護

5. **Server Actions の積極的活用**
   - フォーム処理での Server Actions 使用
   - API Route との適切な使い分け

---

## ドキュメント構成

詳細な実装方針は以下のドキュメントを参照してください：

- [222_NextJS_ServerComponents.md](./222_NextJS_ServerComponents.md) - React Server Components 優先原則
- [223_NextJS_Caching.md](./223_NextJS_Caching.md) - キャッシング戦略
- [224_NextJS_Authentication.md](./224_NextJS_Authentication.md) - 認証管理
- [225_NextJS_ServerActions.md](./225_NextJS_ServerActions.md) - Server Actions
- [226_NextJS_DataFetching.md](./226_NextJS_DataFetching.md) - データフェッチング
- [227_NextJS_AsyncAPIs.md](./227_NextJS_AsyncAPIs.md) - 非同期 API の活用
- [228_NextJS_ErrorHandling.md](./228_NextJS_ErrorHandling.md) - エラーハンドリング
- [229_NextJS_Performance.md](./229_NextJS_Performance.md) - パフォーマンス最適化
- [230_NextJS_BestPractices.md](./230_NextJS_BestPractices.md) - その他のベストプラクティス

---

**関連ドキュメント:**
- [基本設計書](./100_BasicDesign.md)
- [全体アーキテクチャ](./202_DetailedDesign_Architecture.md)

