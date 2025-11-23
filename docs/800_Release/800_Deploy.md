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

## 🔧 トラブルシューティング

問題が発生した場合は、以下のドキュメントを参照してください。

**詳細**: [803_DEPLOY_Troubleshooting.md](./803_DEPLOY_Troubleshooting.md)

---

## 📝 デプロイ前チェックリスト・FAQ

デプロイ前の確認事項、参考リンク、よくある質問は以下のドキュメントを参照してください。

**詳細**: [804_DEPLOY_Checklist.md](./804_DEPLOY_Checklist.md)
