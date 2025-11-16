# トラブルシューティング

このドキュメントでは、Cloudflare Pagesへのデプロイ時に発生する可能性のある問題とその解決方法を説明します。

---

## Workers & Pagesが見つからない場合

**問題**: Cloudflare Dashboardで「Workers & Pages」が見つからない

**解決方法**:

### 方法1: Compute & AIセクションからアクセス

1. 左サイドバーの「**Compute & AI**」セクションを展開
2. 「**Workers & Pages**」をクリック

### 方法2: 直接URLでアクセス（推奨）

以下のURLに直接アクセスしてください：

- [Cloudflare Pages](https://dash.cloudflare.com/?to=/:account/pages)

このURLを使用すると、直接Cloudflare Pagesのページに移動できます。

### 方法3: 検索機能を使用

1. Cloudflare Dashboardの上部にある検索バーを使用
2. 「Pages」または「Workers & Pages」と入力
3. 検索結果から選択

---

## Create applicationボタンが見つからない場合

**問題**: 「Create application」ボタンが表示されない

**解決方法**:

### 重要なポイント

Cloudflare Pagesには「Create application」というボタンはありません。代わりに、以下のオプションが表示されます：

1. 「**Import an existing Git repository**」- GitHubからインポート（こちらを使用）
2. 「**Drag and drop your files**」- ファイルを直接アップロード

### 手順

1. [Cloudflare Pages](https://dash.cloudflare.com/?to=/:account/pages) にアクセス
2. ページ上部に「**Workers**」と「**Pages**」の2つのタブがあることを確認
3. 「**Pages**」タブをクリック（「Workers」タブの隣）
4. 「**Import an existing Git repository**」の「**Get started**」ボタンをクリック

**注意**: 
- 「Get started」ボタンは「Import an existing Git repository」の右側にあります
- もし「Pages」タブが見つからない場合は、直接URLを使用してください：
  - [Cloudflare Pages](https://dash.cloudflare.com/?to=/:account/pages)

---

## ビルドエラーが発生する場合

### build:cloudflareスクリプトが見つからない

**問題**: `ERR_PNPM_NO_SCRIPT Missing script: build:cloudflare`というエラーが発生する

**解決方法**:

1. **最新のコミットがプッシュされているか確認**
   ```bash
   git log --oneline -3
   git show HEAD:package.json | grep build:cloudflare
   ```
   `build:cloudflare`スクリプトが含まれていることを確認してください。

2. **Cloudflare Pagesのビルド設定を確認**
   - Cloudflare Dashboard → プロジェクト → Settings → Builds & deployments
   - **Build command**が`pnpm install && pnpm run build:cloudflare`になっているか確認
   - **Production branch**が正しいブランチ（`master`または`main`）になっているか確認

3. **再デプロイを実行**
   - Cloudflare Dashboardで「**Retry deployment**」をクリック
   - または、新しい空のコミットを作成してプッシュ：
     ```bash
     git commit --allow-empty -m "trigger rebuild"
     git push
     ```

4. **ビルドコマンドを直接指定する方法（代替）**
   - Build commandを`pnpm install && npx opennextjs-cloudflare build`に変更
   - これにより、`package.json`のスクリプトに依存せずに直接コマンドを実行できます

### Node.jsバージョンの確認

**問題**: Node.jsのバージョンが適切でない

**解決方法**:
- Cloudflare PagesはNode.js 18以上を推奨
- プロジェクトルートに`.nvmrc`ファイルを作成してNode.jsバージョンを指定
- 例: `.nvmrc`に`20`と記載

### 依存関係のインストール

**問題**: `pnpm install`が失敗する

**解決方法**:
1. ローカルで`pnpm install`が正常に実行されることを確認
2. `package.json`の依存関係が正しいことを確認
3. `pnpm-lock.yaml`が最新であることを確認
4. ビルドコマンドに`pnpm install`が含まれていることを確認

### ビルドログの確認

**問題**: ビルドが失敗するが原因が不明

**解決方法**:
1. Cloudflare Dashboardの「**Deployments**」タブでビルドログを確認
2. エラーメッセージを確認して問題を特定
3. ローカルで同じビルドコマンドを実行して再現するか確認

```bash
# ローカルでビルドをテスト
pnpm run build:cloudflare
```

---

## 環境変数が読み込まれない場合

### 変数名の確認

**問題**: 環境変数がアプリケーションで読み込まれない

**解決方法**:
1. **クライアントサイドで使用する変数**
   - `NEXT_PUBLIC_`で始まる必要がある
   - 例: `NEXT_PUBLIC_SUPABASE_URL`

2. **サーバーサイドのみで使用する変数**
   - `NEXT_PUBLIC_`を付けない
   - Cloudflare Pagesの環境変数として設定

3. **変数名のスペルチェック**
   - 大文字小文字を正確に一致させる
   - アンダースコアの位置を確認

### 再デプロイ

**問題**: 環境変数を変更したが反映されない

**解決方法**:
- 環境変数を変更した後は、再デプロイが必要です
- GitHub連携を使用している場合:
  - 新しいコミットをプッシュする
  - または、Cloudflare Dashboardで手動で再デプロイをトリガー

---

## Supabase接続エラー

### CORS設定の確認

**問題**: Supabaseへの接続がCORSエラーで失敗する

**解決方法**:
1. Supabase Dashboardで、Cloudflare PagesのURLを許可リストに追加
2. 「**Settings**」→「**API**」→「**CORS**」で設定
3. ワイルドカード（`*`）を使用する場合は、本番環境では推奨されません

### RLS（Row Level Security）の確認

**問題**: データベースへのアクセスが拒否される

**解決方法**:
1. SupabaseのRLSポリシーが正しく設定されているか確認
2. 認証トークンが正しく送信されているか確認
3. サーバーサイドでService Role Keyを使用する必要がある場合は、環境変数として設定（`NEXT_PUBLIC_`を付けない）

---

## デプロイが完了しない場合

### ビルドタイムアウト

**問題**: ビルドがタイムアウトする

**解決方法**:
1. ビルド時間を短縮する
   - 不要な依存関係を削除
   - ビルドキャッシュを活用
2. Cloudflare Pagesの無料プランにはビルド時間の制限があります
3. 必要に応じて有料プランへのアップグレードを検討

### ネットワークエラー

**問題**: デプロイ中にネットワークエラーが発生する

**解決方法**:
1. インターネット接続を確認
2. しばらく待ってから再試行
3. Cloudflareのステータスページを確認

---

## パフォーマンスの問題

### 初回ロードが遅い

**問題**: アプリケーションの初回ロードが遅い

**解決方法**:
1. ビルド出力を確認（`.open-next`ディレクトリ）
2. 静的アセットが正しく生成されているか確認
3. Cloudflareのキャッシュ設定を確認

### 404エラー

**問題**: サイト全体が404エラーになる、または特定のページが404エラーになる

**解決方法**:

#### サイト全体が404エラーになる場合

1. **Cloudflare Pagesの設定を確認**
   - Settings → Builds & deployments
   - **Build output directory**が`.open-next`になっているか確認
   - **Functions directory**が設定されていないことを確認（OpenNext.js Cloudflareは自動的にWorkerを認識します）

2. **`wrangler.jsonc`の設定を確認**
   - `pages_build_output_dir`が`.open-next`になっているか確認
   - `main`が**設定されていない**ことを確認（Cloudflare Pagesでは`main`と`pages_build_output_dir`を同時に使用できません）
   - `assets`セクションが**設定されていない**ことを確認（OpenNext.js Cloudflareが自動的に処理します）

3. **ビルド出力の確認**
   - ビルドログで「Worker saved in `.open-next/worker.js`」というメッセージが表示されているか確認
   - ビルドログで「Copied worker.js to _worker.js」というメッセージが表示されているか確認
   - `.open-next/worker.js`と`.open-next/_worker.js`ファイルが生成されているか確認
   - **重要**: Cloudflare Pagesは`_worker.js`を探すため、`resolve-symlinks.js`スクリプトが`worker.js`を`_worker.js`にコピーします

4. **再デプロイ**
   - 設定を変更した後は、再デプロイが必要です
   - Cloudflare Dashboardで「Retry deployment」をクリック

#### 特定のページが404エラーになる場合

1. ルーティング設定を確認
2. `next.config.ts`の設定を確認
3. ビルド出力に該当ファイルが含まれているか確認

---

## よくあるエラーメッセージ

### "Build failed: Command failed"

**原因**: ビルドコマンドが失敗している

**解決方法**:
- ビルドログを確認して具体的なエラーを特定
- ローカルで同じコマンドを実行して再現

### "Environment variable not found"

**原因**: 環境変数が設定されていない

**解決方法**:
- Cloudflare Dashboardで環境変数が正しく設定されているか確認
- 変数名のスペルを確認

### "Module not found"

**原因**: 依存関係がインストールされていない

**解決方法**:
- `pnpm install`がビルドコマンドに含まれているか確認
- `package.json`の依存関係を確認

### Build output directoryが見つからない

**問題**: `Build output directory not found`というエラーが発生する

**解決方法**:

1. **`wrangler.jsonc`の設定を確認**
   - `pages_build_output_dir: ".open-next"`が設定されているか確認
   - 設定されていない場合は追加してください

2. **Cloudflare Pagesの設定を確認**
   - Settings → Builds & deployments
   - **Build output directory**が`.open-next`になっているか確認
   - または、空欄のままにしておく（`wrangler.jsonc`の設定が自動的に使用されます）

3. **ビルドが成功しているか確認**
   - ビルドログで「OpenNext build complete.」というメッセージが表示されているか確認
   - `.open-next`ディレクトリが生成されているか確認

4. **再デプロイ**
   - 設定を変更した後は、再デプロイが必要です
   - Cloudflare Dashboardで「Retry deployment」をクリック

### シンボリックリンクエラー

**問題**: `Failed: build output directory contains links to files that can't be accessed`

**原因**: OpenNext.jsのビルド出力にシンボリックリンクが含まれており、Cloudflare Pagesがそれを処理できない

**解決方法**:
1. **自動解決（推奨）**
   - `package.json`の`build:cloudflare`スクリプトに`resolve-symlinks.js`が含まれていることを確認
   - ビルド後に自動的にシンボリックリンクが解決されます

2. **手動確認**
   - ビルドログで「Resolving symlinks in .open-next directory...」というメッセージが表示されることを確認
   - エラーが続く場合は、`.open-next`ディレクトリの構造を確認

3. **代替方法**
   - ビルドコマンドを`pnpm install && pnpm run build:cloudflare`から変更しないでください
   - `resolve-symlinks.js`スクリプトが正しく実行されるようにしてください

---

## サポート

問題が解決しない場合は、以下を参照してください：

- [Cloudflare Pages ドキュメント](https://developers.cloudflare.com/pages/)
- [OpenNext.js Cloudflare アダプター](https://opennext.js.org/cloudflare)
- [Wrangler CLI ドキュメント](https://developers.cloudflare.com/workers/wrangler/)

---

## 関連ドキュメント

- [メインデプロイ手順書](./800_DEPLOY.md)
- [GitHub連携デプロイ](./801_DEPLOY_GitHub.md)
- [Wrangler CLIデプロイ](./802_DEPLOY_Wrangler.md)
- [デプロイ前チェックリスト](./804_DEPLOY_Checklist.md)

