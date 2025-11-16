# Wrangler CLIによる手動デプロイ

このドキュメントでは、Wrangler CLIを使用してCloudflare Pagesに手動でデプロイする手順を説明します。

この方法は、コマンドラインから直接デプロイを実行します。

---

## ステップ1: Wranglerのログイン

```bash
npx wrangler login
```

ブラウザが開き、Cloudflareアカウントでログインします。

---

## ステップ2: 環境変数の設定

`wrangler.jsonc`に環境変数を追加するか、コマンドラインで指定します。

### 方法A: wrangler.jsoncに追加

```jsonc
{
  // ... 既存の設定 ...
  "vars": {
    "NEXT_PUBLIC_SUPABASE_URL": "あなたのSupabaseプロジェクトURL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "あなたのSupabase Anon Key"
  }
}
```

**注意**: 機密情報は`wrangler.jsonc`に直接書かないでください。

### 方法B: コマンドラインで指定（推奨）

機密情報は`wrangler.jsonc`に直接書かないでください。代わりに、Cloudflare Dashboardで設定するか、環境変数として指定します。

---

## ステップ3: ビルドとデプロイ

### 一括実行

```bash
# ビルドとデプロイを一度に実行
pnpm run deploy
```

### 個別実行

```bash
# ビルド
pnpm run build:cloudflare

# デプロイ（Wranglerを使用）
npx wrangler pages deploy .open-next --project-name=auriary
```

---

## ステップ4: 環境変数の設定（CLI経由）

環境変数をCloudflare Pagesのシークレットとして設定する場合：

```bash
# 環境変数を設定（対話形式で入力）
npx wrangler pages secret put NEXT_PUBLIC_SUPABASE_URL
npx wrangler pages secret put NEXT_PUBLIC_SUPABASE_ANON_KEY
```

または、環境変数として直接指定：

```bash
NEXT_PUBLIC_SUPABASE_URL="your-url" \
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-key" \
npx wrangler pages deploy .open-next --project-name=auriary
```

---

## プレビューデプロイ

本番環境にデプロイする前に、プレビュー環境でテストできます：

```bash
# プレビュービルドとデプロイ
pnpm run preview
```

---

## デプロイの確認

デプロイ後、以下のコマンドでデプロイ状況を確認できます：

```bash
# デプロイ履歴を確認
npx wrangler pages deployment list --project-name=auriary

# 現在のデプロイ情報を確認
npx wrangler pages project list
```

---

## 関連ドキュメント

- [メインデプロイ手順書](./800_DEPLOY.md)
- [トラブルシューティング](./803_DEPLOY_Troubleshooting.md)
- [デプロイ前チェックリスト](./804_DEPLOY_Checklist.md)

