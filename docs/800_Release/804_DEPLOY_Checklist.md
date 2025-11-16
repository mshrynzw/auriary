# デプロイ前チェックリスト・FAQ

このドキュメントでは、デプロイ前の確認事項、参考リンク、よくある質問をまとめています。

---

## 📝 デプロイ前チェックリスト

デプロイ前に以下を確認してください：

### コードの確認

- [ ] ローカルで`pnpm run build:cloudflare`が正常に完了する
- [ ] ローカルで`pnpm run start`でアプリが起動する（通常のNext.jsビルドの場合）
- [ ] 型チェックが通る（`pnpm run types`）
- [ ] リントエラーがない（`pnpm run lint`）
- [ ] テストが通る（`pnpm run test:run`）

### 環境変数の確認

- [ ] 必要な環境変数がすべて設定されている
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] 環境変数の値が正しい（本番環境のSupabaseプロジェクトを指している）
- [ ] 機密情報（Service Role Keyなど）が公開されていない

### Supabaseの確認

- [ ] Supabaseプロジェクトが本番環境で利用可能
- [ ] データベースマイグレーションが適用されている
- [ ] RLS（Row Level Security）ポリシーが正しく設定されている
- [ ] CORS設定にCloudflare PagesのURLが含まれている

### セキュリティの確認

- [ ] `.gitignore`に`.env`が含まれている（機密情報をコミットしない）
- [ ] 環境変数に機密情報が含まれていない（`NEXT_PUBLIC_`で始まる変数は公開される）
- [ ] APIキーやトークンがハードコードされていない

### ビルド設定の確認

- [ ] `package.json`に`build:cloudflare`スクリプトが含まれている
- [ ] `.nvmrc`ファイルが存在し、適切なNode.jsバージョンが指定されている
- [ ] `wrangler.jsonc`の設定が正しい

---

## 🔗 参考リンク

### Cloudflare関連

- [Cloudflare Pages ドキュメント](https://developers.cloudflare.com/pages/)
- [Cloudflare Pages ビルド設定](https://developers.cloudflare.com/pages/platform/build-configuration/)
- [Cloudflare Pages 環境変数](https://developers.cloudflare.com/pages/platform/environment-variables/)
- [Wrangler CLI ドキュメント](https://developers.cloudflare.com/workers/wrangler/)

### OpenNext.js関連

- [OpenNext.js Cloudflare アダプター](https://opennext.js.org/cloudflare)
- [OpenNext.js 設定](https://opennext.js.org/cloudflare/configuration)

### Supabase関連

- [Supabase ドキュメント](https://supabase.com/docs)
- [Supabase Auth ドキュメント](https://supabase.com/docs/guides/auth)
- [Supabase RLS ドキュメント](https://supabase.com/docs/guides/auth/row-level-security)

### Next.js関連

- [Next.js ドキュメント](https://nextjs.org/docs)
- [Next.js デプロイメント](https://nextjs.org/docs/deployment)

---

## 💡 次のステップ

デプロイが完了したら、以下のステップを検討してください：

### パフォーマンスの最適化

1. **Cloudflareのキャッシュ設定を調整**
   - 静的アセットのキャッシュ期間を設定
   - 動的コンテンツのキャッシュ戦略を検討

2. **R2ストレージを使用したキャッシュ（オプション）**
   - インクリメンタルキャッシュをR2に保存
   - `open-next.config.ts`でR2キャッシュを有効化

### モニタリング

1. **Cloudflare Analyticsでトラフィックを監視**
   - リクエスト数、帯域幅、エラー率を確認
   - パフォーマンスメトリクスを分析

2. **エラーログを確認**
   - Cloudflare Dashboardでエラーログを確認
   - 必要に応じてアラートを設定

### CI/CDの設定

1. **GitHub Actionsで自動テストを実行**
   - プッシュ時に自動でテストを実行
   - テストが通らない場合はデプロイをブロック

2. **プルリクエストごとにプレビューデプロイ**
   - 変更内容を確認してからマージ
   - プレビューデプロイのURLをコメントに追加

### セキュリティの強化

1. **環境変数の管理**
   - 機密情報はCloudflare Dashboardのシークレットとして管理
   - 環境ごと（本番・ステージング）に環境変数を分離

2. **アクセス制御**
   - 必要に応じて認証を追加
   - IP制限やWAFルールを設定

---

## ❓ よくある質問

### プラン・料金について

**Q: 無料プランで利用できますか？**
A: はい、Cloudflare Pagesは無料プランで利用できます。ただし、リクエスト数やビルド時間に制限があります。詳細は[Cloudflare Pagesの料金ページ](https://developers.cloudflare.com/pages/platform/pricing/)を参照してください。

**Q: どのくらいのリクエストまで無料で利用できますか？**
A: 無料プランでは、月500回のビルドと無制限のリクエストが利用できます。詳細は公式ドキュメントを確認してください。

### ドメインについて

**Q: カスタムドメインは必要ですか？**
A: いいえ、Cloudflare Pagesは自動的に`*.pages.dev`のサブドメインを提供します。カスタムドメインはオプションです。

**Q: カスタムドメインを設定するにはどうすればいいですか？**
A: Cloudflare Dashboardの「Settings」→「Custom domains」から設定できます。詳細は[カスタムドメインの設定](https://developers.cloudflare.com/pages/platform/custom-domains/)を参照してください。

### 環境変数について

**Q: 環境変数を変更した後、どうすればいいですか？**
A: 環境変数を変更した後は、再デプロイが必要です。GitHub連携を使用している場合、新しいコミットをプッシュするか、手動で再デプロイをトリガーしてください。

**Q: 環境変数はどこで設定しますか？**
A: Cloudflare Dashboardの「Settings」→「Environment variables」から設定できます。GitHub連携を使用している場合、環境ごと（Production、Preview）に設定できます。

### ビルドについて

**Q: ビルドにどのくらい時間がかかりますか？**
A: プロジェクトのサイズや依存関係によって異なりますが、通常は3-10分程度です。初回ビルドは依存関係のインストールに時間がかかることがあります。

**Q: ビルドが失敗する場合はどうすればいいですか？**
A: [トラブルシューティング](./803_DEPLOY_Troubleshooting.md)を参照してください。ビルドログを確認して、具体的なエラーメッセージを特定することが重要です。

### デプロイについて

**Q: デプロイは自動的に実行されますか？**
A: GitHub連携を設定している場合、`main`ブランチ（または設定したProduction branch）へのプッシュで自動的にデプロイされます。その他のブランチへのプッシュでは、プレビューデプロイが作成されます。

**Q: 特定のコミットだけをデプロイできますか？**
A: はい、Cloudflare Dashboardの「Deployments」タブから、過去のデプロイを再デプロイできます。

### Supabaseについて

**Q: Supabaseの接続エラーが発生します。どうすればいいですか？**
A: [トラブルシューティング](./803_DEPLOY_Troubleshooting.md)の「Supabase接続エラー」セクションを参照してください。CORS設定とRLSポリシーを確認することが重要です。

---

## 関連ドキュメント

- [メインデプロイ手順書](./800_DEPLOY.md)
- [GitHub連携デプロイ](./801_DEPLOY_GitHub.md)
- [Wrangler CLIデプロイ](./802_DEPLOY_Wrangler.md)
- [トラブルシューティング](./803_DEPLOY_Troubleshooting.md)

