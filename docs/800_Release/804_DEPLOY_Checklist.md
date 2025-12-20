# デプロイ前チェックリスト・FAQ（Vercel デプロイ）

このドキュメントでは、Vercelへのデプロイ前の確認事項、参考リンク、よくある質問をまとめています。

---

## 📝 デプロイ前チェックリスト

デプロイ前に以下を確認してください：

### Vercel の確認

- [ ] Vercel にアプリがデプロイ済みである
- [ ] 本番 URL（`https://auriary.vercel.app`）が正常に動作している
- [ ] ログイン機能が正常に動作している
- [ ] 環境変数が正しく設定されている

### コードの確認

- [ ] 型チェックが通る（`pnpm run types`）
- [ ] リントエラーがない（`pnpm run lint`）
- [ ] テストが通る（`pnpm run test:run`）
- [ ] ローカルでビルドが成功する（`pnpm build`）

### 環境変数の確認

- [ ] Vercel 側で必要な環境変数がすべて設定されている
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] 環境変数の値が正しい（本番環境のSupabaseプロジェクトを指している）
- [ ] 機密情報（Service Role Keyなど）が公開されていない
- [ ] `NEXT_PUBLIC_` で始まる変数はクライアント側でも利用可能であることを理解している

### Supabase の確認

- [ ] Supabase プロジェクトが本番環境で利用可能
- [ ] データベースマイグレーションが適用されている
- [ ] RLS（Row Level Security）ポリシーが正しく設定されている
- [ ] CORS 設定に Vercel のドメインが含まれている（必要に応じて）

### セキュリティの確認

- [ ] `.gitignore` に `.env` が含まれている（機密情報をコミットしない）
- [ ] 環境変数に機密情報が含まれていない（`NEXT_PUBLIC_` で始まる変数は公開される）
- [ ] API キーやトークンがハードコードされていない

### カスタムドメインの確認（オプション）

- [ ] カスタムドメイン（`www.auriaries.org` など）が設定されている（オプション）
- [ ] DNS レコードが正しく設定されている
- [ ] SSL/TLS 証明書が有効になっている（Vercelが自動設定）

---

## 🔗 参考リンク

### Vercel 関連

- [Vercel ドキュメント](https://vercel.com/docs)
- [Vercel デプロイメント](https://vercel.com/docs/deployments/overview)
- [Vercel 環境変数](https://vercel.com/docs/projects/environment-variables)

### Supabase 関連

- [Supabase ドキュメント](https://supabase.com/docs)
- [Supabase Auth ドキュメント](https://supabase.com/docs/guides/auth)
- [Supabase RLS ドキュメント](https://supabase.com/docs/guides/auth/row-level-security)

### Next.js 関連

- [Next.js ドキュメント](https://nextjs.org/docs)
- [Next.js デプロイメント](https://nextjs.org/docs/deployment)

---

## 💡 次のステップ

デプロイが完了したら、以下のステップを検討してください：

### パフォーマンスの最適化

1. **Vercel Analytics で監視**
   - Vercel Dashboard → **Analytics** でパフォーマンスメトリクスを確認
   - ページの読み込み速度を最適化

2. **画像の最適化**
   - Next.js Image コンポーネントを使用
   - 画像のサイズを最適化

3. **キャッシュの活用**
   - Next.js のキャッシュ設定を確認
   - 静的生成（SSG）を活用

### CI/CD の設定

1. **GitHub Actions で自動テストを実行**
   - プッシュ時に自動でテストを実行
   - テストが通らない場合はデプロイをブロック

2. **自動デプロイ**
   - Vercel への自動デプロイ（既に設定済み）
   - プルリクエストごとにプレビューデプロイが作成される

### セキュリティの強化

1. **環境変数の管理**
   - 機密情報は Vercel Dashboard の環境変数として管理
   - 環境ごと（本番・プレビュー・開発）に環境変数を分離

2. **アクセス制御**
   - 必要に応じて認証を追加
   - Supabase RLS でデータアクセスを制御

---

## ❓ よくある質問

### プラン・料金について

**Q: 無料プランで利用できますか？**
A: はい、Vercel の無料プランで利用できます。ただし、ビルド時間や帯域幅に制限があります。詳細は [Vercel の料金ページ](https://vercel.com/pricing) を確認してください。

**Q: どのくらいのリクエストまで無料で利用できますか？**
A: Vercel の無料プランでは、月100GB の帯域幅まで利用できます。詳細は各サービスの料金ページを確認してください。

### ドメインについて

**Q: カスタムドメインは必要ですか？**
A: いいえ、必須ではありません。Vercel が提供するデフォルトのドメイン（`https://auriary.vercel.app` など）でも利用できます。ただし、カスタムドメインを使用することで、ブランディングや SEO の向上が期待できます。

**Q: カスタムドメインを設定するにはどうすればいいですか？**
A: Vercel Dashboard → プロジェクト → **Settings** → **Domains** から設定できます。詳細は[メインデプロイ手順書](./800_Deploy.md)を参照してください。

### 環境変数について

**Q: 環境変数を変更した後、どうすればいいですか？**
A: Vercel 側の環境変数を変更した場合は、Vercel が自動的に再デプロイします。手動で再デプロイする場合は、Vercel Dashboard → **Deployments** → **Redeploy** をクリックしてください。

**Q: 環境変数はどこで設定しますか？**
A: Vercel Dashboard → プロジェクト → **Settings** → **Environment Variables** から設定します。環境ごと（Production、Preview、Development）に設定できます。

### デプロイについて

**Q: デプロイは自動的に実行されますか？**
A: はい、GitHub にプッシュすると自動的にデプロイが実行されます。プルリクエストごとにプレビューデプロイも作成されます。

**Q: ビルドが失敗する場合はどうすればいいですか？**
A: [トラブルシューティング](./803_DEPLOY_Troubleshooting.md)の「ビルドエラー」セクションを参照してください。主な原因は依存関係のエラー、環境変数の未設定、TypeScriptエラーなどです。

### ログインについて

**Q: ログインが完了しない場合はどうすればいいですか？**
A: [トラブルシューティング](./803_DEPLOY_Troubleshooting.md)の「ログインが完了しない場合」セクションを参照してください。主な原因は Supabase の設定や CORS 設定です。

### Supabase について

**Q: Supabase の接続エラーが発生します。どうすればいいですか？**
A: Vercel 側で Supabase への接続が正常に動作していることを確認してください。環境変数（`NEXT_PUBLIC_SUPABASE_URL` と `NEXT_PUBLIC_SUPABASE_ANON_KEY`）が正しく設定されているか確認してください。

---

## 関連ドキュメント

- [メインデプロイ手順書](./800_Deploy.md)
- [トラブルシューティング](./803_DEPLOY_Troubleshooting.md)
