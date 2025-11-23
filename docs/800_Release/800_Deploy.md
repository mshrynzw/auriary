# Cloudflare デプロイ手順書

このドキュメントでは、auriaryプロジェクトをCloudflareにデプロイする手順を説明します。

## ⚡ 推奨: パターン2（Cloudflare Workers プロキシ + Vercel オリジン）

**このパターンが推奨です。** OpenNext のビルドエラーを回避でき、シンプルで安定した構成です。

### クイックスタート（3分でデプロイ）

1. **Vercel にデプロイ済みであることを確認**
   - 本番 URL: `https://auriary.vercel.app` が正常に動作していること

2. **Cloudflare Worker プロキシをデプロイ**
   ```bash
   pnpm install
   pnpm cf:proxy:deploy
   ```

3. **Cloudflare ダッシュボードでカスタムドメインを設定**
   - Cloudflare Dashboard → Workers & Pages → **Workers** タブ
   - `auriary-proxy` Worker を選択
   - **Triggers** → **Routes** → 「Add route」をクリック
   - ルートを追加: `www.auriaries.org/*` または `auriaries.org/*`
   - Zone: `auriaries.org`
   - 保存

4. **完了！**
   - カスタムドメインからアクセス可能になります
   - Cloudflare のエッジキャッシュにより、非ログイン時のページ読み込み速度が向上します

**詳細**: プロジェクトルートの `README.md` の「Hybrid Deploy Pattern 2」セクションを参照してください。

---

## ⚠️ 非推奨: パターン1（Cloudflare Pages + OpenNext）

**注意**: このパターンは `node:timers` などのビルドエラーが発生する可能性があります。パターン2の使用を強く推奨します。

### クイックスタート（5分でデプロイ）

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
    - **Build command**: `pnpm install && pnpm run build:cloudflare`（OpenNext を使用 - バンドルサイズ最適化）
    - **Build output directory**: `.open-next`
    - **注意**: `@cloudflare/next-on-pages` はバンドルサイズが大きくなるため、OpenNext を推奨します
     - Compatibility flags（Settings → Runtime）: `nodejs_compat`
     - **Compatibility date（Settings → Runtime）**: `2024-09-22`（重要：OpenNext が生成したコードが `node:` プレフィックスを使っていないため、2024-09-22 以前の日付が必要）
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
