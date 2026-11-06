# auriary ドキュメント一覧

本ディレクトリには、auriary プロジェクトの設計・開発ドキュメントが格納されています。

---

## 📖 ドキュメントの読み方

### 開発を始める前に

1. **[要件定義書](./000_Requirements/000_Requirements.md)** でプロジェクトの全体像を把握
   - 機能要件・非機能要件・制約条件を確認

2. **[基本設計書](./100_BasicDesign/100_BasicDesign.md)** でシステム概要を確認
   - 使用技術、想定ユーザー、提供価値を理解

3. **[Next.js 16 実装方針（概要）](./300_Cording/321_NextJS_Implementation_Overview.md)** で実装方針を理解
   - Next.js 16 の新機能とベストプラクティスを把握

### 実装時

#### UI実装

- **[画面一覧](./200_DetailedDesign/203_DetailedDesign_UI.md)** で画面仕様を確認
- **[コンポーネント設計](./200_DetailedDesign/207_DetailedDesign_Components.md)** でコンポーネントの実装方針を確認

#### 機能実装

- **[機能設計](./200_DetailedDesign/204_DetailedDesign_Functions.md)** で機能仕様を確認
- **[API設計](./200_DetailedDesign/206_DetailedDesign_API.md)** でAPI仕様を確認
- **[Server Actions](./300_Cording/325_NextJS_ServerActions.md)** で実装パターンを確認

#### データベース操作

- **[データベース設計](./200_DetailedDesign/205_DetailedDesign_Database.md)** でテーブル概要を確認
- **[ER図](./200_DetailedDesign/205_DetailedDesign_ER_Diagram.md)** でテーブル間の関係を確認
- **[テーブル定義書](./200_DetailedDesign/205_DetailedDesign_Table_Definition.md)** で詳細なカラム定義を確認

#### コーディング規約

- **[コーディング規約（概要）](./300_Cording/301_CodingStandards.md)** で全体像を把握（ESLint設定のトラブルシューティングも含む）
- **[TypeScript 規約](./300_Cording/302_TypeScript.md)** で型定義の書き方を確認
- **[スキーマ設計](./300_Cording/311_SchemaDesign.md)** で Zod スキーマの設計原則を確認
- **[命名規則](./300_Cording/303_NamingConventions.md)** でファイル・変数名の規則を確認
- **[Git コミット規約](./300_Cording/304_GitConventions.md)** でコミットメッセージの書き方を確認

#### Next.js 16 実装

- **[React Server Components](./300_Cording/322_NextJS_ServerComponents.md)** でコンポーネント設計原則を確認
- **[キャッシング戦略](./300_Cording/323_NextJS_Caching.md)** で `use cache` の使い方を確認
- **[認証管理](./300_Cording/324_NextJS_Authentication.md)** で認証実装パターンを確認
- **[データフェッチング](./300_Cording/326_NextJS_DataFetching.md)** でデータ取得方法を確認
- **[Next.js エラーハンドリング](./300_Cording/328_NextJS_ErrorHandling.md)** でエラー処理パターンを確認

### 設計レビュー時

- 各詳細設計書を参照して実装が設計と一致しているか確認
- **[セキュリティ設計](./200_DetailedDesign/208_DetailedDesign_Security.md)** でセキュリティ要件を確認
- **[非機能要件](./200_DetailedDesign/210_DetailedDesign_NonFunctional.md)** でパフォーマンス要件を確認

---

## 📚 ドキュメント構成

### 000_Requirements（要件定義書）

**目的：** システムに求められる機能要件・非機能要件・制約条件を明確化

- [000_Requirements.md](./000_Requirements/000_Requirements.md)
  - 機能要件（認証、日記管理、AI連携、カレンダー、分析機能など）
  - 非機能要件（パフォーマンス、セキュリティ、可用性、保守性）
  - データ要件、制約条件、リスク、受入基準

---

### 100_BasicDesign（基本設計書）

**目的：** システム全体の概要と基本方針を定義

- [100_BasicDesign.md](./100_BasicDesign/100_BasicDesign.md)
  - システム概要（アプリ名、コンセプト、使用技術、想定ユーザー、提供価値）
  - 詳細設計書への目次とリンク

---

### 202_DetailedDesign（詳細設計書）

**目的：** システムの詳細な設計仕様を定義

#### アーキテクチャ・設計

- [202_DetailedDesign_Architecture.md](./200_DetailedDesign/202_DetailedDesign_Architecture.md)
  - Next.js 16 App Router 構成
  - Cloudflare Workers と D1
  - デプロイ構成（OpenNext。遠隔 D1 は未作成）

#### UI設計

- [203_DetailedDesign_UI.md](./200_DetailedDesign/203_DetailedDesign_UI.md)
  - 画面一覧（トップ、日記一覧、日記詳細、日記編集、カレンダー、分析、設定）
  - 各画面のURL、概要、使用コンポーネント、UI構成

#### 機能設計

- [204_DetailedDesign_Functions.md](./200_DetailedDesign/204_DetailedDesign_Functions.md)
  - 認証（メールとパスワード、セッション）
  - 日記管理機能（作成・更新・削除、AI Summary生成）
  - タグ管理（自動生成・手動追加）
  - カレンダー（月/週/日ビュー、フィルタリング）
  - AI機能（文章補完、感情分析、Topic Modeling、Summary生成）

#### データベース設計

- [205_DetailedDesign_Database.md](./200_DetailedDesign/205_DetailedDesign_Database.md)
  - 主要テーブル概要
  - セッションの user_id による所有者チェック（RLS は無い）
- [205_DetailedDesign_ER_Diagram.md](./200_DetailedDesign/205_DetailedDesign_ER_Diagram.md)
  - ER図（Mermaid形式）
- [205_DetailedDesign_Table_Definition.md](./200_DetailedDesign/205_DetailedDesign_Table_Definition.md)
  - 全テーブルの詳細定義
- [205_DetailedDesign_Supabase_Advanced.md](./200_DetailedDesign/205_DetailedDesign_Supabase_Advanced.md)
  - Supabase Edge Functions（旧構成。現行では使わない）
  - データベース View
  - RLS ポリシー詳細（旧構成）
  - トリガー、ストアドプロシージャ

#### API設計

- [206_DetailedDesign_API.md](./200_DetailedDesign/206_DetailedDesign_API.md)
  - Route Handlers（日記 CRUD、AI機能、認証関連）
  - バリデーション（Zod）
  - エラーハンドリング
  - 認証フロー

#### コンポーネント設計

- [207_DetailedDesign_Components.md](./200_DetailedDesign/207_DetailedDesign_Components.md)
  - UI コンポーネント一覧（shadcn/ui）
  - 共通コンポーネント（Header, Sidebar）
  - Domain Components（DiaryEditor, DiaryCard, EmotionChart）
  - コンポーネント階層構造

#### セキュリティ設計

- [208_DetailedDesign_Security.md](./200_DetailedDesign/208_DetailedDesign_Security.md)
  - 所有者チェックとセッション Cookie
  - Auth Cookie
  - XSS / CSRF 対策
  - API 認証フロー
  - データ暗号化
  - レート制限（将来実装）

#### ログ・監査

- [209_DetailedDesign_Logging.md](./200_DetailedDesign/209_DetailedDesign_Logging.md)
  - AI 利用ログ（将来実装）
  - 日記更新履歴（将来実装）
  - アクセスログ（将来実装）
  - エラーログ
  - 監査要件

#### 非機能要件

- [210_DetailedDesign_NonFunctional.md](./200_DetailedDesign/210_DetailedDesign_NonFunctional.md)
  - パフォーマンス要件（Workers 上の Next.js）
  - アクセシビリティ
  - 保守性
  - 拡張性
  - 可用性、スケーラビリティ、セキュリティ要件
  - 国際化、ブラウザサポート

---

### 800_Release（デプロイ）

**目的：** 現行の公開手順を示す

- [801_Deploy_Workers.md](./800_Release/801_Deploy_Workers.md)
  - Cloudflare Workers と D1。遠隔データベースは未作成
- [800_Deploy_Vercel.md](./800_Release/800_Deploy_Vercel.md)
  - 以前の Vercel 手順
- [805_DEPLOY_Railway.md](./800_Release/805_DEPLOY_Railway.md)
  - 感情分析 API

---

### 300_Cording（コーディング規約・Next.js 16実装方針）

**目的：** コーディング規約と Next.js 16 の新機能・ベストプラクティスに基づいた実装方針を定義

#### コーディング規約（フレームワーク非依存）

- [301_CodingStandards.md](./300_Cording/301_CodingStandards.md)
  - コーディング規約の概要
  - 基本原則
  - ツールと設定
- [302_TypeScript.md](./300_Cording/302_TypeScript.md)
  - TypeScript コーディング規約
  - 型定義の書き方
  - any の使用禁止
  - 型ガードの使用
- [311_SchemaDesign.md](./300_Cording/311_SchemaDesign.md)
  - Zod スキーマ設計原則
  - テーブルスキーマとフォームスキーマの使い分け
  - Zod v4 の活用方法
- [303_NamingConventions.md](./300_Cording/303_NamingConventions.md)
  - ファイル命名規則
  - ディレクトリ構造
  - 変数・関数の命名規則
- [304_GitConventions.md](./300_Cording/304_GitConventions.md)
  - Git コミット規約（Conventional Commits）
  - ブランチ命名規則
  - プルリクエスト
- [305_ComponentDesign.md](./300_Cording/305_ComponentDesign.md)
  - コンポーネント設計原則（フレームワーク非依存）
  - 単一責任の原則
  - 再利用性・コンポジション
- [306_ErrorHandling.md](./300_Cording/306_ErrorHandling.md)
  - エラーハンドリング規約（フレームワーク非依存）
  - エラークラスの定義
  - エラーハンドリングパターン
- [307_Logging.md](./300_Cording/307_Logging.md)
  - ログ記録規約
  - ログレベルの使い分け
  - 機密情報の保護
- [308_Testing.md](./300_Cording/308_Testing.md)
  - テスト方針（将来実装）
  - ユニットテスト・統合テスト・E2Eテスト
  - テストカバレッジ目標
- [309_CodeReview.md](./300_Cording/309_CodeReview.md)
  - コードレビュー方針
  - レビューチェックリスト
  - 承認基準
- [310_Documentation.md](./300_Cording/310_Documentation.md)
  - ドキュメントコメント規約
  - JSDoc コメント
  - インラインコメント

#### Next.js 16 実装方針

##### 概要

- [321_NextJS_Implementation_Overview.md](./300_Cording/321_NextJS_Implementation_Overview.md)
  - Next.js 16 の採用理由
  - 本プロジェクトでの活用方針
  - ドキュメント構成

##### React Server Components

- [322_NextJS_ServerComponents.md](./300_Cording/322_NextJS_ServerComponents.md)
  - Server Components 優先原則
  - Client Components の使用基準
  - Islands Architecture の適用
  - コンポーネント設計パターン

##### キャッシング戦略

- [323_NextJS_Caching.md](./300_Cording/323_NextJS_Caching.md)
  - `use cache` ディレクティブ
  - `unstable_cache` の活用
  - キャッシュの無効化（タグベース・パスベース）
  - キャッシュ戦略の分類

##### 認証管理

- [324_NextJS_Authentication.md](./300_Cording/324_NextJS_Authentication.md)
  - Server Components での認証
  - Middleware での認証ガード
  - Server Actions での認証
  - セッション管理
  - ログアウト処理

##### Server Actions

- [325_NextJS_ServerActions.md](./300_Cording/325_NextJS_ServerActions.md)
  - Server Actions の実装
  - フォーム処理での活用
  - エラーハンドリング
  - 再検証との統合
  - API Route との使い分け

##### データフェッチング

- [326_NextJS_DataFetching.md](./300_Cording/326_NextJS_DataFetching.md)
  - Server Components での直接フェッチ
  - Streaming の活用
  - 並列データフェッチング
  - エラーハンドリング
  - ローディング状態

##### 非同期 API

- [327_NextJS_AsyncAPIs.md](./300_Cording/327_NextJS_AsyncAPIs.md)
  - `cookies()`, `headers()`, `searchParams` の非同期化
  - 型安全性の向上
  - 並列での非同期 API 呼び出し

##### エラーハンドリング

- [328_NextJS_ErrorHandling.md](./300_Cording/328_NextJS_ErrorHandling.md)
  - Error Boundaries
  - Server Components でのエラーハンドリング
  - Server Actions でのエラーハンドリング
  - グローバルエラーハンドリング
  - エラーログ

##### パフォーマンス最適化

- [329_NextJS_Performance.md](./300_Cording/329_NextJS_Performance.md)
  - Partial Prerendering（将来実装）
  - Image Optimization
  - Font Optimization
  - コード分割
  - バンドルサイズの最適化
  - パフォーマンス目標

##### ベストプラクティス

- [330_NextJS_BestPractices.md](./300_Cording/330_NextJS_BestPractices.md)
  - Metadata API
  - Route Handlers の使い分け
  - Middleware の活用
  - 環境変数の管理
  - 型安全性の確保
  - 開発体験の向上
  - セキュリティ
  - テスト戦略（将来実装）
  - パフォーマンス監視（将来実装）

---

### 400_Test_Operation_Guideline（テスト運用ガイドライン）

**目的：** テスト運用の全体像と1人開発に最適化されたワークフローを定義

- [400_Guideline.md](./400_Test_Operation_Guideline/400_Guideline.md)
  - テスト運用ガイドラインの目次
- [401_Overview.md](./400_Test_Operation_Guideline/401_Overview.md)
  - テストの全体像・開発フロー
- [402_Workflow.md](./400_Test_Operation_Guideline/402_Workflow.md)
  - 1人開発ワークフロー・実践例
- [403_Commit_PR.md](./400_Test_Operation_Guideline/403_Commit_PR.md)
  - コミット・PR規約
- [404_Regression.md](./400_Test_Operation_Guideline/404_Regression.md)
  - デグレ防止・優先順位
- [405_Execution.md](./400_Test_Operation_Guideline/405_Execution.md)
  - テスト実行タイミング
- [406_CI_CD.md](./400_Test_Operation_Guideline/406_CI_CD.md)
  - CI/CDパイプライン
- [407_Branch.md](./400_Test_Operation_Guideline/407_Branch.md)
  - ブランチ戦略
- [408_AI.md](./400_Test_Operation_Guideline/408_AI.md)
  - AI活用
- [409_Release.md](./400_Test_Operation_Guideline/409_Release.md)
  - リリース・メンテナンス
- [410_Infrastructure.md](./400_Test_Operation_Guideline/410_Infrastructure.md)
  - インフラ（Supabase Test DB）
- [411_Reference.md](./400_Test_Operation_Guideline/411_Reference.md)
  - リファレンス（コマンド・トラブルシューティング）

---

### 500_Unit_Test（単体テスト戦略）

**目的：** 個別の関数・コンポーネント・ユーティリティの動作を検証するテスト戦略を定義

- [500_Strategy.md](./500_Unit_Test/500_Strategy.md)
  - 最小限の単体テスト哲学
  - テスト対象/非対象
  - Vitest ルール
  - モッキング
  - 命名規則
  - フォルダ構造
  - テストデータ
  - カバレッジ
  - 実装例
  - Cursor 自動生成情報

---

### 600_Integration_Test（結合テスト戦略）

**目的：** API Route Handler と Supabase の連携を検証するテスト戦略を定義

- [600_Strategy.md](./600_Integration_Test/600_Strategy.md)
  - API Route Handler から Supabase
  - Supabase Local Test DB
  - RLS テスト
  - Service Role key
  - Supertest + Vitest
  - 正常系/異常系
  - API Schema Contract Test
  - auth モッキング
  - トランザクションロールバック
  - 実装例
  - Cursor 自動生成情報

---

### 700_E2E_Test（E2Eテスト戦略）

**目的：** ユーザーが実際に使用する機能をブラウザ上で検証するテスト戦略を定義

- [700Strategy.md](./700_E2E_Test/700Strategy.md)
  - auriary における E2Eテストの重要性
  - Playwright ルール
  - セレクター戦略
  - 過度な待機を避ける
  - テスト対象/非対象
  - テストアカウント管理
  - テストデータ初期化
  - クロスブラウザ/モバイル
  - シナリオ作成
  - 実装例
  - Cursor 自動生成の注意点

---

## 🔗 関連リソース

- **プロジェクト README**: [../README.md](../README.md)
- **Supabase ドキュメント**: [https://supabase.com/docs](https://supabase.com/docs)
- **Next.js ドキュメント**: [https://nextjs.org/docs](https://nextjs.org/docs)
- **Next.js 16 リリースノート**: [https://nextjs.org/blog/next-16](https://nextjs.org/blog/next-16)
- **shadcn/ui ドキュメント**: [https://ui.shadcn.com/](https://ui.shadcn.com/)
- **Tailwind CSS v4 ドキュメント**: [https://tailwindcss.com/docs](https://tailwindcss.com/docs)

---

## 📝 ドキュメント更新方針

### 更新タイミング

- **設計変更時**: 該当する詳細設計書を更新
- **実装方針の変更時**: [300_Cording](./300_Cording/) 配下のドキュメントを更新
- **新機能追加時**: 要件定義書、基本設計書、詳細設計書を更新

### バージョン管理

- 各ドキュメントのヘッダーにバージョン情報を記載
- 重要な変更時はバージョンを更新

### レビュー

- 設計変更時は関連ドキュメントの整合性を確認
- 実装完了後、設計書との整合性を確認

---

## 📋 ドキュメント一覧（クイックリファレンス）

| カテゴリ                   | ドキュメント                                                                                            | 説明                        |
| -------------------------- | ------------------------------------------------------------------------------------------------------- | --------------------------- |
| **要件**                   | [000_Requirements.md](./000_Requirements/000_Requirements.md)                                           | 機能要件・非機能要件        |
| **基本設計**               | [100_BasicDesign.md](./100_BasicDesign/100_BasicDesign.md)                                              | システム概要                |
| **アーキテクチャ**         | [202_DetailedDesign_Architecture.md](./200_DetailedDesign/202_DetailedDesign_Architecture.md)           | 全体アーキテクチャ          |
| **UI**                     | [203_DetailedDesign_UI.md](./200_DetailedDesign/203_DetailedDesign_UI.md)                               | 画面一覧                    |
| **機能**                   | [204_DetailedDesign_Functions.md](./200_DetailedDesign/204_DetailedDesign_Functions.md)                 | 機能設計                    |
| **DB**                     | [205_DetailedDesign_Database.md](./200_DetailedDesign/205_DetailedDesign_Database.md)                   | データベース設計            |
| **Supabase**               | [205_DetailedDesign_Supabase_Advanced.md](./200_DetailedDesign/205_DetailedDesign_Supabase_Advanced.md) | Supabase 高度な機能         |
| **API**                    | [206_DetailedDesign_API.md](./200_DetailedDesign/206_DetailedDesign_API.md)                             | API設計                     |
| **コンポーネント**         | [207_DetailedDesign_Components.md](./200_DetailedDesign/207_DetailedDesign_Components.md)               | コンポーネント設計          |
| **セキュリティ**           | [208_DetailedDesign_Security.md](./200_DetailedDesign/208_DetailedDesign_Security.md)                   | セキュリティ設計            |
| **ログ**                   | [209_DetailedDesign_Logging.md](./200_DetailedDesign/209_DetailedDesign_Logging.md)                     | ログ・監査                  |
| **非機能**                 | [210_DetailedDesign_NonFunctional.md](./200_DetailedDesign/210_DetailedDesign_NonFunctional.md)         | 非機能要件                  |
| **感情分析API**            | [211_DetailedDesign_SentimentAPI.md](./200_DetailedDesign/211_DetailedDesign_SentimentAPI.md)           | 感情分析API設計             |
| **コーディング規約**       | [301_CodingStandards.md](./300_Cording/301_CodingStandards.md)                                          | コーディング規約（概要）    |
| **TypeScript**             | [302_TypeScript.md](./300_Cording/302_TypeScript.md)                                                    | TypeScript コーディング規約 |
| **命名規則**               | [303_NamingConventions.md](./300_Cording/303_NamingConventions.md)                                      | 命名規則・ファイル構造      |
| **Git**                    | [304_GitConventions.md](./300_Cording/304_GitConventions.md)                                            | Git コミット規約            |
| **コンポーネント設計**     | [305_ComponentDesign.md](./300_Cording/305_ComponentDesign.md)                                          | コンポーネント設計原則      |
| **エラーハンドリング**     | [306_ErrorHandling.md](./300_Cording/306_ErrorHandling.md)                                              | エラーハンドリング規約      |
| **ログ**                   | [307_Logging.md](./300_Cording/307_Logging.md)                                                          | ログ記録規約                |
| **テスト**                 | [308_Testing.md](./300_Cording/308_Testing.md)                                                          | テスト方針                  |
| **コードレビュー**         | [309_CodeReview.md](./300_Cording/309_CodeReview.md)                                                    | コードレビュー方針          |
| **ドキュメント**           | [310_Documentation.md](./300_Cording/310_Documentation.md)                                              | ドキュメントコメント規約    |
| **Next.js概要**            | [321_NextJS_Implementation_Overview.md](./300_Cording/321_NextJS_Implementation_Overview.md)            | Next.js 16 実装方針概要     |
| **Server Components**      | [322_NextJS_ServerComponents.md](./300_Cording/322_NextJS_ServerComponents.md)                          | React Server Components     |
| **キャッシング**           | [323_NextJS_Caching.md](./300_Cording/323_NextJS_Caching.md)                                            | キャッシング戦略            |
| **認証**                   | [324_NextJS_Authentication.md](./300_Cording/324_NextJS_Authentication.md)                              | 認証管理                    |
| **Server Actions**         | [325_NextJS_ServerActions.md](./300_Cording/325_NextJS_ServerActions.md)                                | Server Actions              |
| **データ取得**             | [326_NextJS_DataFetching.md](./300_Cording/326_NextJS_DataFetching.md)                                  | データフェッチング          |
| **非同期API**              | [327_NextJS_AsyncAPIs.md](./300_Cording/327_NextJS_AsyncAPIs.md)                                        | 非同期 API                  |
| **Next.jsエラー処理**      | [328_NextJS_ErrorHandling.md](./300_Cording/328_NextJS_ErrorHandling.md)                                | Next.js エラーハンドリング  |
| **パフォーマンス**         | [329_NextJS_Performance.md](./300_Cording/329_NextJS_Performance.md)                                    | パフォーマンス最適化        |
| **ベストプラクティス**     | [330_NextJS_BestPractices.md](./300_Cording/330_NextJS_BestPractices.md)                                | その他のベストプラクティス  |
| **テスト運用ガイドライン** | [400_Guideline.md](./400_Test_Operation_Guideline/400_Guideline.md)                                     | テスト運用の全体像          |
| **単体テスト戦略**         | [500_Strategy.md](./500_Unit_Test/500_Strategy.md)                                                      | 単体テスト戦略              |
| **結合テスト戦略**         | [600_Strategy.md](./600_Integration_Test/600_Strategy.md)                                               | 結合テスト戦略              |
| **E2Eテスト戦略**          | [700Strategy.md](./700_E2E_Test/700Strategy.md)                                                         | E2Eテスト戦略               |

---

**最終更新日:** 2025年1月  
**ドキュメント管理:** auriary Project Team
