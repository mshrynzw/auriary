# auriary 基本設計書

## 1. システム概要

### 1.1 アプリ名
**auriary**（オーリアリー）

### 1.2 コンセプト
AI と連携して日々の記録を楽に・美しく残せる次世代の日記アプリ。ChatGPT とリアルタイム連携し、文章補助・感情分析・タグ自動生成などを自動化します。

### 1.3 使用技術

| カテゴリ | 技術スタック |
|---------|------------|
| フレームワーク | **Next.js 16**（App Router / Server Components / Cache Components） |
| データベース | **Supabase（PostgreSQL + RLS）** |
| ホスティング | **Cloudflare Pages**（@opennextjs/cloudflare を使用） |
| UI フレームワーク | **Tailwind CSS v4**, **shadcn/ui**（全コンポーネント） |
| 認証 | Supabase Auth（Email / OAuth） |
| AI | OpenAI / ChatGPT API |
| PWA | Service Worker、manifest.json、IndexedDB（将来実装） |
| 開発ツール | ESLint + Prettier, TypeScript 5, pnpm |

### 1.4 想定ユーザー
- 日々の記録を習慣化したい個人ユーザー
- 感情や気分の変化を可視化したいユーザー
- AI による文章補助を活用したいユーザー
- 医療・服薬管理を記録したいユーザー（将来的な拡張）

### 1.5 提供価値
- **AI による文章補完・推敲**：日記作成の負担を軽減
- **自動タグ生成**：AI による自動カテゴリ分類
- **感情・傾向分析**：過去の記録から感情シーケンスを可視化
- **セキュアなデータ管理**：Supabase RLS による完全なユーザースコープ
- **クロスデバイス同期**：Supabase を利用したリアルタイム同期
- **PWA対応**（将来実装）：オフライン対応、ホーム画面へのインストール、ネイティブアプリのような体験

---

## 詳細設計書

詳細設計書は以下のドキュメントに分割されています。

### 2. 全体アーキテクチャ
→ [202_DetailedDesign_Architecture.md](../202_DetailedDesign/202_DetailedDesign_Architecture.md)

### 3. 画面一覧（UI設計）
→ [203_DetailedDesign_UI.md](../202_DetailedDesign/203_DetailedDesign_UI.md)

### 4. 機能設計
→ [204_DetailedDesign_Functions.md](../202_DetailedDesign/204_DetailedDesign_Functions.md)

### 5. データベース設計
→ [205_DetailedDesign_Database.md](../202_DetailedDesign/205_DetailedDesign_Database.md)

**関連ドキュメント:**
- [205_DetailedDesign_ER_Diagram.md](../202_DetailedDesign/205_DetailedDesign_ER_Diagram.md) - ER図
- [205_DetailedDesign_Table_Definition.md](../202_DetailedDesign/205_DetailedDesign_Table_Definition.md) - テーブル定義書

### 6. API設計（App Router）
→ [206_DetailedDesign_API.md](../202_DetailedDesign/206_DetailedDesign_API.md)

### 7. コンポーネント設計
→ [207_DetailedDesign_Components.md](../202_DetailedDesign/207_DetailedDesign_Components.md)

### 8. セキュリティ設計
→ [208_DetailedDesign_Security.md](../202_DetailedDesign/208_DetailedDesign_Security.md)

### 9. ログ・監査
→ [209_DetailedDesign_Logging.md](../202_DetailedDesign/209_DetailedDesign_Logging.md)

### 10. 非機能要件
→ [210_DetailedDesign_NonFunctional.md](../202_DetailedDesign/210_DetailedDesign_NonFunctional.md)

### 11. Next.js 16 実装方針
→ [321_NextJS_Implementation_Overview.md](../300_Cording/321_NextJS_Implementation_Overview.md)

**関連ドキュメント:**
- [322_NextJS_ServerComponents.md](../300_Cording/322_NextJS_ServerComponents.md) - React Server Components 優先原則
- [323_NextJS_Caching.md](../300_Cording/323_NextJS_Caching.md) - キャッシング戦略
- [324_NextJS_Authentication.md](../300_Cording/324_NextJS_Authentication.md) - 認証管理
- [325_NextJS_ServerActions.md](../300_Cording/325_NextJS_ServerActions.md) - Server Actions
- [326_NextJS_DataFetching.md](../300_Cording/326_NextJS_DataFetching.md) - データフェッチング
- [327_NextJS_AsyncAPIs.md](../300_Cording/327_NextJS_AsyncAPIs.md) - 非同期 API の活用
- [328_NextJS_ErrorHandling.md](../300_Cording/328_NextJS_ErrorHandling.md) - エラーハンドリング
- [329_NextJS_Performance.md](../300_Cording/329_NextJS_Performance.md) - パフォーマンス最適化
- [330_NextJS_BestPractices.md](../300_Cording/330_NextJS_BestPractices.md) - その他のベストプラクティス

---

**作成日:** 2025年1月  
**バージョン:** 1.0.0  
**作成者:** auriary Project Team

