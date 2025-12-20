# Vercel デプロイ手順書

このドキュメントでは、auriaryプロジェクトをVercelにデプロイする手順を説明します。

## ⚡ クイックスタート（3分でデプロイ）

1. **GitHubリポジトリをVercelに接続**
   - [Vercel Dashboard](https://vercel.com/dashboard) にログイン
   - 「**Add New Project**」をクリック
   - GitHubリポジトリを選択してインポート

2. **環境変数を設定**
   - Vercel Dashboard → プロジェクト → **Settings** → **Environment Variables**
   - 以下の環境変数を追加：
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

3. **デプロイ**
   - 「**Deploy**」をクリック
   - ビルドが完了すると自動的にデプロイされます

4. **完了！**
   - デプロイされたURL（例: `https://auriary.vercel.app`）からアクセス可能になります

---

## 📋 前提条件

- GitHubアカウント（コードをホスティングするため）
- Vercelアカウント（無料で作成可能）
- Supabaseプロジェクト（既に使用している前提）

---

## 📚 詳細手順

### 1. Vercelアカウントの作成

1. [Vercel](https://vercel.com) にアクセス
2. 「**Sign Up**」をクリック
3. GitHubアカウントでサインアップ（推奨）

### 2. プロジェクトのインポート

1. Vercel Dashboard → 「**Add New Project**」
2. GitHubリポジトリを選択
3. プロジェクト設定を確認：
   - **Framework Preset**: Next.js（自動検出）
   - **Root Directory**: `./`（デフォルト）
   - **Build Command**: `pnpm build`（自動検出）
   - **Output Directory**: `.next`（自動検出）
   - **Install Command**: `pnpm install`（自動検出）

### 3. 環境変数の設定

Vercel Dashboard → プロジェクト → **Settings** → **Environment Variables** で以下を設定：

#### 必須環境変数

- `NEXT_PUBLIC_SUPABASE_URL`
  - SupabaseプロジェクトのURL
  - 例: `https://xxxxx.supabase.co`

- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - SupabaseプロジェクトのAnon Key
  - Supabase Dashboard → **Settings** → **API** から取得

#### オプション環境変数（将来実装）

- `OPENAI_API_KEY`（AI機能を使用する場合）

### 4. カスタムドメインの設定（オプション）

1. Vercel Dashboard → プロジェクト → **Settings** → **Domains**
2. 「**Add Domain**」をクリック
3. カスタムドメインを入力（例: `www.auriaries.org`）
4. DNS設定の指示に従って設定
   - Vercelが提供するDNSレコードをDNSプロバイダーに追加
   - SSL証明書は自動的に設定されます

---

## 🔄 CI/CDの設定

VercelはGitHubと連携することで、自動的にCI/CDが設定されます。

### 自動デプロイの仕組み

- **プッシュ時の自動デプロイ**: `main`（または`master`）ブランチへのプッシュで自動デプロイ
- **プルリクエスト**: プルリクエストごとにプレビューデプロイが作成されます
- **ビルドログ**: Vercel Dashboardでビルドログを確認できます

### ブランチ設定

1. Vercel Dashboard → プロジェクト → **Settings** → **Git**
2. **Production Branch** を設定（デフォルト: `main` または `master`）
3. 必要に応じて **Ignored Build Step** を設定

---

## 🔧 トラブルシューティング

問題が発生した場合は、以下のドキュメントを参照してください。

**詳細**: [803_DEPLOY_Troubleshooting.md](./803_DEPLOY_Troubleshooting.md)

---

## 📝 デプロイ前チェックリスト・FAQ

デプロイ前の確認事項、参考リンク、よくある質問は以下のドキュメントを参照してください。

**詳細**: [804_DEPLOY_Checklist.md](./804_DEPLOY_Checklist.md)

---

## 📖 参考リンク

- [Vercel ドキュメント](https://vercel.com/docs)
- [Vercel デプロイメント](https://vercel.com/docs/deployments/overview)
- [Next.js デプロイメント](https://nextjs.org/docs/deployment)
- [Supabase ドキュメント](https://supabase.com/docs)
