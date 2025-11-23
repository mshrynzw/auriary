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

## 📋 前提条件

- Cloudflareアカウント（無料で作成可能）
- GitHubアカウント（コードをホスティングするため）
- Supabaseプロジェクト（既に使用している前提）

---

## 📚 詳細手順

パターン2の詳細な設定手順については、以下のドキュメントを参照してください：

- **カスタムドメインの設定**: Cloudflare Dashboard → Workers & Pages → Workers → `auriary-proxy` → Triggers → Routes
- **環境変数の確認**: `cloudflare-proxy/wrangler.toml` の `ORIGIN_BASE_URL` が正しい Vercel URL を指しているか確認

---

## 🔄 CI/CDの設定（GitHub Actions）

`cloudflare-proxy/`ディレクトリの変更を自動デプロイするには、GitHub Actionsを設定します。

### 1. Cloudflare APIトークンの取得

1. Cloudflare Dashboard → 右上のプロフィールアイコン → 「**My Profile**」
2. 「**API Tokens**」タブ → 「**Create Token**」
3. 「**Edit Cloudflare Workers**」テンプレートを選択、またはカスタムトークンを作成
   - 権限: `Account` → `Cloudflare Workers` → `Edit`
4. トークンをコピー（一度しか表示されません）

### 2. CloudflareアカウントIDの取得

1. Cloudflare Dashboard → 右側の「**Account ID**」をコピー

### 3. GitHub Secretsの設定

1. GitHubリポジトリ → 「**Settings**」→ 「**Secrets and variables**」→ 「**Actions**」
2. 「**New repository secret**」をクリック
3. 以下の2つのSecretsを追加：
   - **Name**: `CLOUDFLARE_API_TOKEN`
     - **Value**: 上記で取得したAPIトークン
   - **Name**: `CLOUDFLARE_ACCOUNT_ID`
     - **Value**: 上記で取得したアカウントID

### 4. 動作確認

1. `cloudflare-proxy/src/worker.ts`を少し変更（例: コメント追加）
2. コミット・プッシュ
3. GitHubリポジトリの「**Actions**」タブでデプロイ状況を確認

### 5. 自動デプロイの仕組み

- `.github/workflows/cloudflare-deploy.yml`が`cloudflare-proxy/`ディレクトリの変更を検知
- `master`ブランチへのpush時に自動的に`wrangler deploy`を実行
- 手動実行も可能（GitHub Actionsの「Run workflow」ボタンから）

**注意**: GitHub Secretsを設定しない場合、手動で`pnpm cf:proxy:deploy`を実行する必要があります。

---

## 🔧 トラブルシューティング

問題が発生した場合は、以下のドキュメントを参照してください。

**詳細**: [803_DEPLOY_Troubleshooting.md](./803_DEPLOY_Troubleshooting.md)

---

## 📝 デプロイ前チェックリスト・FAQ

デプロイ前の確認事項、参考リンク、よくある質問は以下のドキュメントを参照してください。

**詳細**: [804_DEPLOY_Checklist.md](./804_DEPLOY_Checklist.md)
