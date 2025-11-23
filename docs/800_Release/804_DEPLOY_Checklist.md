# デプロイ前チェックリスト・FAQ（パターン2：Cloudflare Workers プロキシ + Vercel オリジン）

このドキュメントでは、パターン2のデプロイ前の確認事項、参考リンク、よくある質問をまとめています。

---

## 📝 デプロイ前チェックリスト

デプロイ前に以下を確認してください：

### Vercel の確認

- [ ] Vercel にアプリがデプロイ済みである
- [ ] 本番 URL（`https://auriary.vercel.app`）が正常に動作している
- [ ] ログイン機能が正常に動作している
- [ ] 環境変数が正しく設定されている

### Cloudflare Worker の確認

- [ ] `cloudflare-proxy/wrangler.toml` の `ORIGIN_BASE_URL` が正しい Vercel URL を指している
- [ ] `cloudflare-proxy/src/worker.ts` に構文エラーがない
- [ ] ローカルで `pnpm cf:proxy:dev` が正常に動作する

### コードの確認

- [ ] 型チェックが通る（`pnpm run types`）
- [ ] リントエラーがない（`pnpm run lint`）
- [ ] テストが通る（`pnpm run test:run`）

### 環境変数の確認

- [ ] Vercel 側で必要な環境変数がすべて設定されている
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] 環境変数の値が正しい（本番環境のSupabaseプロジェクトを指している）
- [ ] 機密情報（Service Role Keyなど）が公開されていない

### Supabase の確認

- [ ] Supabase プロジェクトが本番環境で利用可能
- [ ] データベースマイグレーションが適用されている
- [ ] RLS（Row Level Security）ポリシーが正しく設定されている
- [ ] CORS 設定に Cloudflare Workers のドメインが含まれている（必要に応じて）

### セキュリティの確認

- [ ] `.gitignore` に `.env` が含まれている（機密情報をコミットしない）
- [ ] 環境変数に機密情報が含まれていない（`NEXT_PUBLIC_` で始まる変数は公開される）
- [ ] API キーやトークンがハードコードされていない

### カスタムドメインの確認

- [ ] カスタムドメイン（`www.auriaries.org` など）が Cloudflare で管理されている
- [ ] DNS レコードが正しく設定されている
- [ ] SSL/TLS 証明書が有効になっている

---

## 🔗 参考リンク

### Cloudflare 関連

- [Cloudflare Workers ドキュメント](https://developers.cloudflare.com/workers/)
- [Cloudflare Workers ルーティング](https://developers.cloudflare.com/workers/configuration/routing/)
- [Wrangler CLI ドキュメント](https://developers.cloudflare.com/workers/wrangler/)

### Vercel 関連

- [Vercel ドキュメント](https://vercel.com/docs)
- [Vercel デプロイメント](https://vercel.com/docs/deployments/overview)

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

1. **Cloudflare のキャッシュ設定を調整**
   - 静的アセットのキャッシュ期間を設定（現在：1日）
   - 動的コンテンツのキャッシュ戦略を検討（現在：60秒）

2. **モニタリング**
   - Cloudflare Analytics でトラフィックを監視
   - Worker のログを確認してエラーを監視

### CI/CD の設定

1. **GitHub Actions で自動テストを実行**
   - プッシュ時に自動でテストを実行
   - テストが通らない場合はデプロイをブロック

2. **自動デプロイ**
   - Vercel への自動デプロイ（既に設定済み）
   - Cloudflare Worker への自動デプロイ（必要に応じて）

### セキュリティの強化

1. **環境変数の管理**
   - 機密情報は Cloudflare Dashboard のシークレットとして管理
   - 環境ごと（本番・ステージング）に環境変数を分離

2. **アクセス制御**
   - 必要に応じて認証を追加
   - IP 制限や WAF ルールを設定

---

## ❓ よくある質問

### プラン・料金について

**Q: 無料プランで利用できますか？**
A: はい、Cloudflare Workers と Vercel の両方が無料プランで利用できます。ただし、リクエスト数やビルド時間に制限があります。

**Q: どのくらいのリクエストまで無料で利用できますか？**
A: Cloudflare Workers の無料プランでは、月10万リクエストまで利用できます。Vercel の無料プランでは、月100GB の帯域幅まで利用できます。詳細は各サービスの料金ページを確認してください。

### ドメインについて

**Q: カスタムドメインは必要ですか？**
A: いいえ、必須ではありません。ただし、カスタムドメインを使用することで、ブランディングや SEO の向上が期待できます。

**Q: カスタムドメインを設定するにはどうすればいいですか？**
A: Cloudflare Dashboard → Workers & Pages → Workers → `auriary-proxy` → Triggers → Routes から設定できます。詳細は[メインデプロイ手順書](./800_Deploy.md)を参照してください。

### 環境変数について

**Q: 環境変数を変更した後、どうすればいいですか？**
A: Vercel 側の環境変数を変更した場合は、Vercel が自動的に再デプロイします。Cloudflare Worker 側の環境変数（`ORIGIN_BASE_URL` など）を変更した場合は、Worker を再デプロイする必要があります：
```bash
pnpm cf:proxy:deploy
```

**Q: 環境変数はどこで設定しますか？**
A: Vercel 側の環境変数は Vercel Dashboard の「Settings」→「Environment Variables」から設定します。Cloudflare Worker 側の環境変数は `cloudflare-proxy/wrangler.toml` の `[vars]` セクションで設定します。

### デプロイについて

**Q: デプロイは自動的に実行されますか？**
A: Vercel へのデプロイは、GitHub にプッシュすると自動的に実行されます。Cloudflare Worker へのデプロイは、手動で `pnpm cf:proxy:deploy` を実行する必要があります（必要に応じて GitHub Actions で自動化できます）。

**Q: Vercel と Cloudflare Worker のどちらを先にデプロイすればいいですか？**
A: Vercel を先にデプロイして、正常に動作することを確認してから Cloudflare Worker をデプロイすることを推奨します。

### ログインについて

**Q: ログインが完了しない場合はどうすればいいですか？**
A: [トラブルシューティング](./803_DEPLOY_Troubleshooting.md)の「ログインが完了しない場合」セクションを参照してください。主な原因は Set-Cookie ヘッダーの処理です。

### Supabase について

**Q: Supabase の接続エラーが発生します。どうすればいいですか？**
A: Vercel 側で Supabase への接続が正常に動作していることを確認してください。Cloudflare Worker は Vercel へのプロキシのみを行い、Supabase への直接接続は行いません。

---

## 関連ドキュメント

- [メインデプロイ手順書](./800_Deploy.md)
- [トラブルシューティング](./803_DEPLOY_Troubleshooting.md)
