# Cloudflare Pages デプロイ手順書

このドキュメントでは、auriaryプロジェクトをCloudflare Pagesにデプロイする手順を説明します。

## ⚡ クイックスタート（5分でデプロイ）

1. **GitHubにコードをプッシュ**
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push
   ```

2. **Cloudflare Pagesでプロジェクト作成**
   - [Cloudflare Pages](https://dash.cloudflare.com/?to=/:account/pages) に直接アクセス（推奨）
   - または、左サイドバーの「**Compute & AI**」→「**Workers & Pages**」を選択
   - ページ上部の「**Pages**」タブをクリック（重要：最初は「Workers」タブが選択されています）
   - 「**Import an existing Git repository**」の「**Get started**」ボタンをクリック
   - GitHubアカウントを認証・接続してリポジトリを選択
   - ビルド設定：
     - Build command: `pnpm install && pnpm run build:cloudflare`
     - Build output directory: `.open-next`
      - Compatibility flags（Settings → Functions）: `nodejs_compat`
      - Build comments / cache: 任意（nc-chatと同じでOK）
    - Runtime → Placement: `Default`（Workers互換）
    - Fail open/closed: `Fail open`（推奨）

3. **環境変数を設定**
   - Settings → Environment variables
   - `NEXT_PUBLIC_SUPABASE_URL` と `NEXT_PUBLIC_SUPABASE_ANON_KEY` を追加

4. **デプロイ**
   - Save and Deploy をクリック
   - 完了！

> 💡 **Windowsローカルでの注意**  
> OpenNext/Next.js は `.next/standalone` 生成時にシンボリックリンクを作成します。  
> Cloudflare の本番ビルドはLinuxで実行されるため問題ありませんが、ローカル検証を行う場合は **開発者モードを有効にする** か **WSL上で `pnpm run build:cloudflare` を実行** してください。

詳細な手順は以下を参照してください。

---

## 📋 前提条件

- Cloudflareアカウント（無料で作成可能）
- GitHubアカウント（コードをホスティングするため）
- Supabaseプロジェクト（既に使用している前提）

---

## 📚 デプロイ方法

Cloudflare Pagesへのデプロイには2つの方法があります：

### 方法1: GitHub連携による自動デプロイ（推奨・初心者向け）

GitHubにコードをプッシュするたびに自動的にビルド・デプロイされます。

**詳細手順**: [801_DEPLOY_GitHub.md](./801_DEPLOY_GitHub.md)

### 方法2: Wrangler CLIによる手動デプロイ

コマンドラインから直接デプロイします。

**詳細手順**: [802_DEPLOY_Wrangler.md](./802_DEPLOY_Wrangler.md)

---

## 🔧 トラブルシューティング

問題が発生した場合は、以下のドキュメントを参照してください。

**詳細**: [803_DEPLOY_Troubleshooting.md](./803_DEPLOY_Troubleshooting.md)

---

## 📝 デプロイ前チェックリスト・FAQ

デプロイ前の確認事項、参考リンク、よくある質問は以下のドキュメントを参照してください。

**詳細**: [804_DEPLOY_Checklist.md](./804_DEPLOY_Checklist.md)
