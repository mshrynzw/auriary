# トラブルシューティング（Vercel デプロイ）

このドキュメントでは、Vercelへのデプロイ時に発生する可能性のある問題とその解決方法を説明します。

---

## ビルドエラー

### 問題: ビルドが失敗する

**解決方法:**

1. **ビルドログを確認**
   - Vercel Dashboard → プロジェクト → **Deployments** → 失敗したデプロイを選択
   - **Build Logs** タブでエラーメッセージを確認

2. **よくある原因と対処法**
   - **依存関係のエラー**

     ```bash
     # ローカルで確認
     pnpm install
     pnpm build
     ```

     - `pnpm-lock.yaml` が最新であることを確認
     - 依存関係のバージョン競合を確認

   - **環境変数が設定されていない**
     - Vercel Dashboard → **Settings** → **Environment Variables** で確認
     - 必要な環境変数がすべて設定されているか確認

   - **TypeScriptエラー**

     ```bash
     # ローカルで確認
     pnpm run types
     ```

     - 型エラーを修正

   - **ESLintエラー**
     ```bash
     # ローカルで確認
     pnpm run lint
     ```

     - リントエラーを修正

---

## 環境変数の問題

### 問題: 環境変数が読み込まれない

**解決方法:**

1. **環境変数の確認**
   - Vercel Dashboard → **Settings** → **Environment Variables**
   - 環境変数が正しく設定されているか確認
   - `NEXT_PUBLIC_` で始まる変数はクライアント側でも利用可能

2. **環境ごとの設定**
   - **Production**: 本番環境用
   - **Preview**: プレビュー環境用（プルリクエストなど）
   - **Development**: 開発環境用
   - 必要に応じて環境ごとに設定

3. **再デプロイ**
   - 環境変数を変更した後は、再デプロイが必要です
   - Vercel Dashboard → **Deployments** → **Redeploy**

---

## ログインが完了しない場合

### 問題: ログインページで「ログイン中...」のまま完了しない

**解決方法:**

1. **ブラウザの開発者ツールで確認**
   - F12 キーを押して開発者ツールを開く
   - **Network** タブでログインリクエストのステータスコードを確認
   - **Console** タブでエラーメッセージを確認
   - **Application** タブ → **Cookies** で Cookie が正しく設定されているか確認

2. **Supabase設定の確認**
   - Supabase Dashboard → **Settings** → **API**
   - `NEXT_PUBLIC_SUPABASE_URL` と `NEXT_PUBLIC_SUPABASE_ANON_KEY` が正しいか確認

3. **CORS設定の確認**
   - Supabase Dashboard → **Settings** → **API** → **CORS**
   - Vercelのドメイン（`https://auriary.vercel.app` など）が許可されているか確認

4. **Set-Cookie ヘッダーの確認**
   - Network タブでログインリクエストのレスポンスヘッダーを確認
   - `Set-Cookie` ヘッダーが存在するか確認
   - `Domain` 属性が正しいドメインになっているか確認

---

## パフォーマンスの問題

### 問題: ページの読み込みが遅い

**解決方法:**

1. **Vercel Analytics で確認**
   - Vercel Dashboard → プロジェクト → **Analytics**
   - パフォーマンスメトリクスを確認

2. **画像の最適化**
   - Next.js Image コンポーネントを使用
   - 画像のサイズを最適化

3. **キャッシュの確認**
   - Next.js のキャッシュ設定を確認
   - 静的生成（SSG）を活用

---

## よくあるエラーメッセージ

### "Failed to fetch"

**原因**: Supabaseへの接続エラー

**解決方法:**

- `NEXT_PUBLIC_SUPABASE_URL` が正しく設定されているか確認
- Supabaseプロジェクトがアクティブか確認
- ネットワーク接続を確認

### "Module not found"

**原因**: 依存関係の問題

**解決方法:**

- `pnpm-lock.yaml` が最新であることを確認
- ローカルで `pnpm install` を実行してから再デプロイ

### "Environment variable not found"

**原因**: 環境変数が設定されていない

**解決方法:**

- Vercel Dashboard → **Settings** → **Environment Variables** で確認
- 必要な環境変数をすべて設定

---

## サポート

問題が解決しない場合は、以下を参照してください：

- [Vercel ドキュメント](https://vercel.com/docs)
- [Next.js ドキュメント](https://nextjs.org/docs)
- [Supabase ドキュメント](https://supabase.com/docs)
- [Vercel サポート](https://vercel.com/support)

---

## 関連ドキュメント

- [メインデプロイ手順書](./800_Deploy.md)
- [デプロイ前チェックリスト](./804_DEPLOY_Checklist.md)
