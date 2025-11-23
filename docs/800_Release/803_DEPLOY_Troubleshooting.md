# トラブルシューティング（パターン2：Cloudflare Workers プロキシ + Vercel オリジン）

このドキュメントでは、パターン2（Cloudflare Workers プロキシ + Vercel オリジン）のデプロイ時に発生する可能性のある問題とその解決方法を説明します。

---

## Workers & Pages が見つからない場合

**問題**: Cloudflare Dashboard で「Workers & Pages」が見つからない

**解決方法**:

1. 左サイドバーの「**Compute & AI**」セクションを展開
2. 「**Workers & Pages**」をクリック
3. または、直接URLでアクセス: [Workers & Pages](https://dash.cloudflare.com/?to=/:account/workers)

---

## Worker が見つからない場合

**問題**: `auriary-proxy` Worker が見つからない

**解決方法**:

1. Cloudflare Dashboard → Workers & Pages → **Workers** タブを選択
2. `auriary-proxy` Worker が表示されているか確認
3. 表示されていない場合:
   ```bash
   pnpm cf:proxy:deploy
   ```
   を実行して Worker をデプロイ

---

## カスタムドメインのルート設定が見つからない場合

**問題**: Cloudflare Dashboard でルート設定が見つからない

**解決方法**:

1. Cloudflare Dashboard → Workers & Pages → **Workers** タブを選択
2. `auriary-proxy` Worker を選択
3. **Triggers** タブを選択
4. **Routes** セクションで「Add route」をクリック
5. ルートを追加:
   - Route: `www.auriaries.org/*` または `auriaries.org/*`
   - Zone: `auriaries.org`

**注意**: 「Triggers」タブが見つからない場合は、Worker が正しくデプロイされているか確認してください。

---

## ログインが完了しない場合

**問題**: ログインページで「ログイン中...」のまま完了しない

**解決方法**:

1. **ブラウザの開発者ツールで確認**
   - F12 キーを押して開発者ツールを開く
   - **Network** タブでログインリクエストのステータスコードを確認
   - **Console** タブでエラーメッセージを確認
   - **Application** タブ → **Cookies** で Cookie が正しく設定されているか確認

2. **Cloudflare Worker のログを確認**
   - Cloudflare Dashboard → Workers & Pages → Workers → `auriary-proxy`
   - **Logs** タブでエラーログを確認

3. **Set-Cookie ヘッダーの確認**
   - Network タブでログインリクエストのレスポンスヘッダーを確認
   - `Set-Cookie` ヘッダーが存在するか確認
   - `Domain` 属性が正しいドメイン（`www.auriaries.org` など）になっているか確認

4. **Vercel オリジンの確認**
   - `https://auriary.vercel.app` が正常に動作しているか確認
   - Vercel 側でログインが正常に動作するか確認

---

## 環境変数の確認

**問題**: Worker が Vercel オリジンに接続できない

**解決方法**:

1. **`cloudflare-proxy/wrangler.toml` の確認**
   ```toml
   [vars]
   ORIGIN_BASE_URL = "https://auriary.vercel.app"
   ```
   - `ORIGIN_BASE_URL` が正しい Vercel URL を指しているか確認

2. **Worker の環境変数を確認**
   - Cloudflare Dashboard → Workers & Pages → Workers → `auriary-proxy`
   - **Settings** → **Variables** で環境変数を確認
   - `ORIGIN_BASE_URL` が設定されているか確認

---

## キャッシュの問題

**問題**: 更新したコンテンツが表示されない

**解決方法**:

1. **ブラウザのキャッシュをクリア**
   - Ctrl+Shift+Delete でキャッシュをクリア
   - シークレットモードでアクセス

2. **Cloudflare のキャッシュをパージ**
   - Cloudflare Dashboard → ドメイン → **Caching** → **Configuration**
   - 「**Purge Everything**」をクリック

3. **ログイン状態で確認**
   - ログイン済みユーザーのリクエストはキャッシュされないため、ログインして確認

---

## よくあるエラーメッセージ

### "Failed to fetch"

**原因**: Vercel オリジンへの接続エラー

**解決方法**:
- `https://auriary.vercel.app` が正常に動作しているか確認
- `ORIGIN_BASE_URL` が正しく設定されているか確認

### "No such module"

**原因**: Worker のコードに問題がある

**解決方法**:
- `cloudflare-proxy/src/worker.ts` の構文エラーを確認
- 再デプロイ:
  ```bash
  pnpm cf:proxy:deploy
  ```

---

## サポート

問題が解決しない場合は、以下を参照してください：

- [Cloudflare Workers ドキュメント](https://developers.cloudflare.com/workers/)
- [Wrangler CLI ドキュメント](https://developers.cloudflare.com/workers/wrangler/)
- [Vercel ドキュメント](https://vercel.com/docs)

---

## 関連ドキュメント

- [メインデプロイ手順書](./800_Deploy.md)
- [デプロイ前チェックリスト](./804_DEPLOY_Checklist.md)
