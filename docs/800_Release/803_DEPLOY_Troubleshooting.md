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

## Internal Server Error（500エラー）

**問題**: サイトが「Internal Server Error」を表示する

**原因**: サーバー側でエラーが発生している。主な原因は以下の通りです：

### 1. 環境変数が設定されていない（最も一般的）

**症状**: ビルドは成功するが、サイトにアクセスすると「Internal Server Error」が表示される

**解決方法**:

1. **Cloudflare Pagesで環境変数を設定**
   - Settings → Environment variables
   - 以下の環境変数を追加：
     - `NEXT_PUBLIC_SUPABASE_URL`: あなたのSupabaseプロジェクトURL
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: あなたのSupabase Anon Key
   - **重要**: 環境変数は「**Production**」環境に設定してください
   - プレビュー環境用に設定する場合は、「**Preview**」タブでも設定が必要です

2. **環境変数の確認**
   - 変数名が正確であることを確認（`NEXT_PUBLIC_`で始まる必要がある）
   - 値が正しく設定されていることを確認（スペースや改行が含まれていないか）
   - 値の前後に引用符（`"`や`'`）が含まれていないことを確認
   - 「**Production**」環境に設定されていることを確認

3. **ビルド時の環境変数**
   - Cloudflare Pagesでは、環境変数は実行時にWorkerに渡されます
   - ビルドログに「Build environment variables: (none found)」と表示されても、実行時の環境変数は別に設定されます
   - ただし、`NEXT_PUBLIC_`で始まる変数はクライアントサイドでも使用されるため、正しく設定されている必要があります

4. **再デプロイ**
   - 環境変数を設定した後は、必ず再デプロイが必要です
   - Cloudflare Dashboardで「Retry deployment」をクリック
   - または、新しいコミットをプッシュして自動デプロイをトリガー

5. **環境変数の確認方法**
   - Cloudflare Dashboard → Observability → Overview → Events でログを確認
   - 「**Live**」ボタンをクリックしてリアルタイムログを有効化
   - サイトにアクセスしてエラーを再現
   - ログで以下を確認：
     - `Environment variables check:` のログ
     - `hasUrl` と `hasKey` の値（`true`になっている必要がある）
     - `allEnvKeys` に `NEXT_PUBLIC_SUPABASE_URL` と `NEXT_PUBLIC_SUPABASE_ANON_KEY` が含まれているか
     - `Missing Supabase environment variables` のエラーメッセージ

6. **環境変数が設定されているのに読み込まれない場合**
   - **重要**: Cloudflare Pagesでは、環境変数は実行時にWorkerに渡されます
   - しかし、`NEXT_PUBLIC_`で始まる変数はクライアントサイドでも使用されるため、特別な処理が必要な場合があります
   - 環境変数が「**Production**」環境に設定されていることを確認
   - 環境変数の値に余分なスペースや改行が含まれていないことを確認
   - 環境変数を削除して再追加してみる
   - 再デプロイを実行する

### 2. Cloudflare Pagesのログを確認

**方法A: デプロイメントログから確認**

1. Cloudflare Dashboardでプロジェクトを開く
2. 「**Deployments**」タブを選択
3. 最新のデプロイメントをクリック
4. 「**Functions**」タブまたは「**Logs**」タブでエラーログを確認
5. エラーメッセージを確認して原因を特定

**方法B: リアルタイムログを確認（推奨）**

1. Cloudflare Dashboardでプロジェクトを開く
2. 左サイドバーから「**Observability**」を選択
3. 「**Overview**」タブを選択（デフォルト）
4. サブタブで「**Events**」を選択
5. 右上の「**Live**」ボタンをクリック（リアルタイムログを有効化）
6. 別のタブでサイト（`https://6362f759.auriary.pages.dev`）にアクセスしてエラーを再現
7. Observabilityの画面でリアルタイムでログを確認
8. 以下を確認：
   - `Environment variables check:` のログが表示されているか
   - `hasUrl` と `hasKey` の値
   - `allEnvKeys` の内容
   - エラーメッセージの有無

**注意**: ログが表示されるまで数秒かかる場合があります。また、「Live」ボタンをクリックしないとリアルタイムログが表示されません。

**Observabilityでログが表示されない場合**:

1. **Observabilityが有効になっているか確認**
   - `wrangler.jsonc`に`"observability": { "enabled": true }`が設定されているか確認
   - 設定されていない場合は追加して再デプロイ

2. **別の方法でログを確認**
   - 方法A（デプロイメントログ）を試す
   - 方法C（Wrangler CLI）を試す
   - ブラウザの開発者ツール（F12）→ Consoleタブでエラーを確認

3. **ログが出力される前にエラーが発生している可能性**
   - サイトにアクセスして、ブラウザのコンソール（F12 → Console）でエラーを確認
   - 「設定エラー」ページが表示されている場合、環境変数が読み込まれていません

**方法C: Wrangler CLIでログを確認（最も確実）**

1. **Wrangler CLIをインストール**（まだの場合）
   ```bash
   npm install -g wrangler
   # または
   pnpm add -g wrangler
   ```

2. **Cloudflareにログイン**
   ```bash
   wrangler login
   ```

3. **リアルタイムログを確認**
   ```bash
   # プロジェクトディレクトリで実行
   cd D:\Code\auriary
   wrangler pages deployment tail
   ```

4. **別のタブでサイトにアクセス（重要）**
   - ブラウザで最新のデプロイメントURLにアクセス
   - Cloudflare Dashboard → Deployments → 最新のデプロイメントのURLを確認
   - 例: `https://d24e7c49.auriary.pages.dev` または `https://auriary.pages.dev`
   - **重要**: ログが表示されるには、サイトにアクセスしてリクエストを生成する必要があります

5. **ログが表示されない場合**:
   - サイトにアクセスしているか確認
   - 最新のデプロイメントIDを指定:
     ```bash
     wrangler pages deployment tail --deployment-id=<デプロイメントID>
     ```
   - デプロイメントIDは、Cloudflare Dashboard → Deployments → 最新のデプロイメントのURLから確認できます
   - または、`wrangler pages deployment list` で一覧を確認

6. **ログで以下を確認**:
   - `Environment variables check:` のログ
   - `hasUrl` と `hasKey` の値
   - `allEnvKeys` の内容
   - `Supabase connection test: OK` またはエラーメッセージ
   - `Failed to get user from Supabase auth:` のエラー
   - `Failed to fetch user profile:` のエラー

**注意**: 
- Wrangler CLIは最も確実にログを確認できる方法です
- ログが表示されない場合は、サイトにアクセスしてリクエストを生成してください
- ログはリアルタイムで表示されるため、サイトにアクセスした直後に表示されます

**よくあるエラーメッセージ**:
- `Missing Supabase environment variables`: 環境変数が設定されていない
- `Error: Failed to fetch`: Supabaseへの接続エラー
- `TypeError: Cannot read property 'x' of undefined`: アプリケーションコードの問題
- `ReferenceError: process is not defined`: 環境変数の読み込みエラー

### 3. Supabase接続の確認

**確認項目**:

1. **Supabase URLとKeyが正しいか**
   - Supabase Dashboard → Settings → API で確認
   - URLは `https://xxxxx.supabase.co` の形式
   - Anon Keyは長い文字列

2. **CORS設定**
   - Supabase Dashboard → Settings → API → CORS
   - Cloudflare PagesのURL（`*.pages.dev`）が許可されているか確認
   - または、`*`（すべてのオリジン）を許可

3. **RLS（Row Level Security）設定**
   - データベーステーブルのRLSが有効になっている場合、適切なポリシーが設定されているか確認

### 4. アプリケーションコードの問題

**確認項目**:

1. **エラーハンドリング**
   - サーバーコンポーネントでエラーが適切に処理されているか
   - `try-catch`ブロックが適切に使用されているか

2. **非同期処理**
   - `await`が適切に使用されているか
   - Promiseのエラーが適切に処理されているか

3. **型エラー**
   - TypeScriptの型エラーがないか確認
   - `pnpm run types`を実行して確認

---

## 静的ファイルの404エラー

**問題**: Next.jsのチャンクファイル、CSS、フォントなどの静的ファイルが404エラーになる

**症状**: 
- ブラウザのコンソールに多数の404エラーが表示される
- `/_next/static/chunks/...` や `/_next/static/media/...` などのファイルが見つからない
- ページは表示されるが、スタイルが適用されない、またはJavaScriptが動作しない

**原因**: 
OpenNext.js Cloudflareが静的ファイルを正しく配信していない可能性があります。

**解決方法**:

1. **ビルド出力の確認**
   - ビルドログで「Bundling static assets...」が表示されているか確認
   - ビルドログで「Uploading... (XXX/XXX)」が表示されているか確認（静的ファイルがアップロードされている）
   - ビルドログで「✨ Success! Uploaded XXX files」が表示されているか確認

2. **Cloudflare Pagesの設定確認**
   - Settings → Builds & deployments
   - **Build output directory**が`.open-next`になっているか確認
   - `wrangler.jsonc`の`pages_build_output_dir`が`.open-next`になっているか確認
   - **Framework preset**が「**Next.js**」になっているか確認（「Next.js (Static HTML Export)」ではない）

3. **静的ファイルのパス確認**
   - ブラウザの開発者ツール（F12）→ Networkタブで、404エラーが発生しているリソースを確認
   - リクエストURLが`https://auriary.pages.dev/_next/static/...`の形式になっているか確認
   - レスポンスヘッダーを確認（404エラーの場合、Cloudflare Pagesがファイルを見つけられていない）

4. **OpenNext.js Cloudflareの動作確認**
   - OpenNext.js Cloudflareは、静的ファイルを`.open-next/assets`ディレクトリに配置します
   - Cloudflare Pagesは、`_worker.js`が静的ファイルのリクエストを処理します
   - 静的ファイルのリクエストは、`_worker.js`によって処理され、適切なファイルが返される必要があります

5. **デプロイメントの確認**
   - Cloudflare Dashboard → Deployments → 最新のデプロイメント
   - 「**Assets uploaded**」タブで、静的ファイルがアップロードされているか確認
   - 静的ファイルの数が0の場合、ビルドプロセスに問題がある可能性があります

6. **再デプロイ**
   - 設定を変更した後は、再デプロイが必要です
   - Cloudflare Dashboardで「Retry deployment」をクリック
   - または、新しいコミットをプッシュして自動デプロイをトリガー

7. **OpenNext.js Cloudflareのバージョン確認**
   - `package.json`で`@opennextjs/cloudflare`のバージョンを確認
   - 最新バージョンに更新してみる：
     ```bash
     pnpm update @opennextjs/cloudflare
     ```

**よくある原因**:
- ビルド出力ディレクトリが正しく設定されていない
- 静的ファイルがビルド時に生成されていない
- Cloudflare Pagesが静的ファイルを正しく認識していない
- `_worker.js`が静的ファイルのリクエストを正しく処理していない

**追加の確認事項**:

8. **ビルドログの詳細確認**
   - ビルドログで「✨ Success! Uploaded XXX files」が表示されているか確認
   - アップロードされたファイル数が0でないことを確認
   - ビルドログで「Bundling static assets...」が表示されているか確認

9. **Cloudflare Pagesのデプロイメント詳細確認**
   - Cloudflare Dashboard → Deployments → 最新のデプロイメント
   - 「**Functions**」タブで`_worker.js`が正しくアップロードされているか確認
   - 「**Assets uploaded**」タブで静的ファイルの一覧を確認
   - 静的ファイルのパスが`/_next/static/...`の形式になっているか確認

10. **OpenNext.js Cloudflareのバージョン確認と更新**
    - ビルドログで`@opennextjs/cloudflare version: 1.12.0`が表示されていることを確認
    - 最新バージョンに更新してみる：
      ```bash
      pnpm update @opennextjs/cloudflare
      ```
    - 更新後、再度ビルドとデプロイを実行

11. **静的ファイルのパス問題の可能性**
    - OpenNext.js Cloudflareは、静的ファイルを`.open-next/assets`ディレクトリに配置します
    - `_worker.js`が`/_next/static/...`パスでリクエストされた静的ファイルを`.open-next/assets`から配信する必要があります
    - もし`_worker.js`が静的ファイルを正しく配信できていない場合、OpenNext.js Cloudflareのバグの可能性があります

**注意**: 
- 環境変数の問題が解決された後も静的ファイルの404エラーが続く場合は、上記の手順を確認してください
- OpenNext.js Cloudflareは静的ファイルを自動的に配信しますが、設定が正しくない場合、404エラーが発生する可能性があります
- ビルドログで「✨ Success! Uploaded XXX files」が表示されているにもかかわらず404エラーが発生する場合、`_worker.js`が静的ファイルを正しく配信できていない可能性が高いです
- この場合、OpenNext.js Cloudflareのバージョンを更新するか、GitHubのIssuesで既知の問題がないか確認してください

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

