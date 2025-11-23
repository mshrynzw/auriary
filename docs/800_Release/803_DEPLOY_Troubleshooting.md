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

### Node.js 組み込みモジュールの解決エラー

**問題**: ビルドログに以下のようなエラーが表示される：

```
✘ [ERROR] Could not resolve "async_hooks"
✘ [ERROR] Could not resolve "fs"
✘ [ERROR] Could not resolve "path"
✘ [ERROR] Could not resolve "url"
...
The package "async_hooks" wasn't found on the file system but is built into node.
- Make sure to prefix the module name with "node:" or update your compatibility_date to 2024-09-23 or later.
```

**原因**: OpenNext が生成したコードが Node.js 組み込みモジュールを直接 `require()` しており、Cloudflare Workers のバンドラーが解決できない。また、Cloudflare Pages のビルドプロセスが `wrangler.toml` の `compatibility_date` と `compatibility_flags` を Worker のバンドル時に適用していない可能性がある。

**解決方法**:

1. **Cloudflare Pages のダッシュボードで直接設定（最重要）**
   - Cloudflare Dashboard → プロジェクト → Settings → **Runtime** セクション
   - **Compatibility date** の横の編集アイコンをクリックし、`2024-09-22` に設定（重要：OpenNext が生成したコードが `node:` プレフィックスを使っていないため、2024-09-22 以前の日付が必要）
   - **Compatibility flags** に `nodejs_compat` が設定されていることを確認（既に設定されている場合はそのままでOK）
   - 設定を保存して再デプロイ

2. **`wrangler.toml` の設定を確認**
   - プロジェクトルートの `wrangler.toml` に以下が設定されていることを確認：
     ```toml
     compatibility_date = "2024-09-22"
     compatibility_flags = ["nodejs_compat"]
     ```
   - ただし、Cloudflare Pages のビルドプロセスでは `wrangler.toml` の設定が Worker のバンドル時に適用されない可能性があるため、**上記のダッシュボードでの設定が必須**です

3. **OpenNext のバージョンを確認**
   - `package.json` の `@opennextjs/cloudflare` が最新バージョン（`^1.13.1`）であることを確認
   - 最新バージョンに更新：
     ```bash
     pnpm update @opennextjs/cloudflare
     ```

4. **代替案を検討**
   - この問題が解決しない場合、以下の選択肢があります：
     - **Vercel のみを使用**（既に動作中：`https://auriary.vercel.app`）
     - **リポジトリを分割**（Cloudflare 用と Vercel 用で分ける）
     - **OpenNext の開発者に報告**（GitHub Issues など）

**注意**: エラーメッセージには「update your compatibility_date to 2024-09-23 or later」とありますが、これは逆です。`compatibility_date` を 2024-09-23 以降にすると `node:` プレフィックスが必須になり、OpenNext の生成コードは対応していません。そのため、**2024-09-22 以前の日付を設定する必要があります**。

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
   - ビルドログで「Copied worker.js to _worker.js for Cloudflare Pages compatibility」というメッセージが表示されているか確認
   - `.open-next/worker.js`と`.open-next/_worker.js`ファイルが生成されているか確認
   - **重要**: Cloudflare Pagesは`_worker.js`を探すため、`resolve-symlinks.js`スクリプトが`worker.js`を`_worker.js`にコピーします
   - **`_worker.js`がアップロードされない場合**:
     - ビルドログで「Error: worker.js not found in .open-next directory」というエラーが表示されていないか確認
     - このエラーが表示される場合、OpenNext.jsのビルドが失敗している可能性があります
     - ビルドログで「Error: Failed to copy worker.js to _worker.js」というエラーが表示されていないか確認
     - このエラーが表示される場合、ファイルのコピーに失敗しています（権限の問題など）

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

**Wrangler CLIログで「Ok」と表示されている場合**:

Wrangler CLIのログで静的ファイルが「Ok」と表示されているにもかかわらず、ブラウザのコンソールで404エラーが表示される場合、以下の可能性があります：

1. **ブラウザのキャッシュ**
   - ブラウザが古いデプロイメントのキャッシュを使用している可能性があります
   - **解決方法**:
     - ブラウザのキャッシュを完全にクリア（Ctrl+Shift+Delete）
     - シークレットモード（プライベートモード）でアクセス
     - デベロッパーツール → Networkタブで「Disable cache」を有効にして再読み込み

2. **デプロイメントURLの不一致**
   - 異なるデプロイメントURLにアクセスしている可能性があります
   - **解決方法**:
     - Cloudflare Dashboard → Deployments → 最新のデプロイメントのURLを確認
     - Wrangler CLIログに表示されているURLと、ブラウザでアクセスしているURLが一致しているか確認
     - 最新のデプロイメントURLに直接アクセス

3. **静的ファイルの部分的読み込み**
   - 一部の静的ファイルは正常に読み込まれているが、他のファイルが404エラーになっている可能性があります
   - **解決方法**:
     - デベロッパーツール → Networkタブで、404エラーが発生しているファイルのリクエストURLを確認
     - そのURLが正しいか確認（`/_next/static/...`の形式になっているか）
     - Wrangler CLIログで、そのファイルが「Ok」と表示されているか確認

4. **タイミングの問題**
   - デプロイ直後にアクセスした場合、静的ファイルがまだ完全に配信されていない可能性があります
   - **解決方法**:
     - 数分待ってから再度アクセス
     - デプロイメントが完全に完了していることを確認（Cloudflare Dashboardで「Success」と表示されているか）

5. **Cloudflare Pagesの「Assets uploaded」タブで確認**
   - Cloudflare Dashboard → Deployments → 最新のデプロイメント → 「**Assets uploaded**」タブ
   - **重要**: 「Assets uploaded」タブが表示されない場合、Cloudflare Pagesが静的ファイルを認識していない可能性があります
   - この場合、OpenNext.js Cloudflareが静的ファイルを`.open-next/assets`ディレクトリに配置しているが、Cloudflare Pagesがそれを認識していない可能性があります
   - **確認方法**:
     - 「**Functions**」タブで`_worker.js`がアップロードされているか確認
     - ビルドログで「✨ Success! Uploaded XXX files」が表示されているか確認
     - Wrangler CLIログで静的ファイルが「Ok」と表示されているか確認
   - **解決方法**:
     - OpenNext.js Cloudflareは、静的ファイルを`.open-next/assets`ディレクトリに配置し、`_worker.js`がそれらを配信します
     - 「Assets uploaded」タブが表示されなくても、`_worker.js`が静的ファイルを正しく配信していれば問題ありません
     - しかし、ブラウザで404エラーが発生している場合、`_worker.js`が静的ファイルを正しく配信できていない可能性があります

6. **Networkタブで404エラーの詳細確認**
   - デベロッパーツール → Networkタブで、404エラーが発生しているファイルをクリック
   - 「**Headers**」タブで以下を確認：
     - **Request URL**: リクエストされたURLが正しいか（`/_next/static/...`の形式になっているか）
     - **Response Headers**: 404エラーの場合、Cloudflare Pagesがファイルを見つけられていない
     - **Status Code**: 404以外のエラーコードが表示されていないか
   - 「**Preview**」タブで、エラーメッセージの内容を確認

7. **OpenNext.js Cloudflareのバージョン確認と更新**
   - 現在のバージョン: `@opennextjs/cloudflare 1.12.0`
   - 最新バージョンに更新してみる：
     ```bash
     pnpm update @opennextjs/cloudflare
     ```
   - 更新後、再度ビルドとデプロイを実行
   - OpenNext.js CloudflareのGitHub Issuesで既知の問題がないか確認：
     - https://github.com/serverless-stack/open-next/issues

8. **Cloudflare Pagesのキャッシュクリア**
   - Cloudflare Dashboard → プロジェクト → Settings → Caching
   - 「**Purge Everything**」をクリックしてキャッシュをクリア
   - または、Cloudflare Dashboard → プロジェクト → Deployments → 最新のデプロイメント → 「**Purge cache**」をクリック

9. **静的ファイルのパス不一致の可能性**
   - ブラウザが`/_next/static/...`パスでリクエストしているが、実際のファイルが別のパスに配置されている可能性があります
   - **確認方法**:
     - Cloudflare Dashboard → Deployments → 最新のデプロイメント → 「**Assets uploaded**」タブ
     - 静的ファイルのパスを確認
     - ブラウザのNetworkタブでリクエストされたURLと比較
   - **解決方法**:
     - パスが一致していない場合、OpenNext.js Cloudflareの設定を確認
     - または、OpenNext.js Cloudflareのバージョンを更新

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

## サイト全体が表示されない場合（404エラー、ERR_NAME_NOT_RESOLVED）

**問題**: `https://auriary.pages.dev`、`https://auriaries.org`、`https://www.auriaries.org` のいずれも表示されない

**確認手順**:

### 1. Cloudflare Pages プロジェクトの存在確認

1. [Cloudflare Dashboard](https://dash.cloudflare.com) にログイン
2. 左サイドバー → **Workers & Pages** → **Pages** タブをクリック
3. **`auriary`** プロジェクトが存在するか確認
   - 存在しない場合 → プロジェクトを作成する必要があります（[デプロイ手順](./800_DEPLOY.md)を参照）
   - 存在する場合 → 次のステップへ

### 2. デプロイメントの状態確認

1. **`auriary`** プロジェクトをクリック
2. **Deployments** タブを確認
3. 最新のデプロイメントの状態を確認：
   - **Success**（緑色）→ デプロイは成功しています（次のステップへ）
   - **Failed**（赤色）→ ビルドが失敗しています（[ビルドエラーの解決](#ビルドエラーが発生する場合)を参照）
   - **Building**（黄色）→ ビルド中です（完了まで待つ）
   - **Queued**（灰色）→ ビルド待ちです（完了まで待つ）

### 3. ビルドログの確認

1. 最新のデプロイメントをクリック
2. **Build logs** タブを確認
3. 以下のメッセージが表示されているか確認：
   - `✅ Symlinks resolved successfully`
   - `🗂️ Copied worker.js to _worker.js`
   - `✨ Ready for Cloudflare Pages deploy`
   - `✨ Build completed`
4. エラーメッセージがないか確認

### 4. カスタムドメインの設定確認

**`https://auriary.pages.dev` が見れない場合**:

1. **Settings** → **Custom domains** を確認
2. `auriary.pages.dev` が表示されているか確認
3. 表示されていない場合 → プロジェクト名が `auriary` であることを確認

**`https://auriaries.org` や `https://www.auriaries.org` が見れない場合**:

1. **Settings** → **Custom domains** を確認
2. `auriaries.org` と `www.auriaries.org` が追加されているか確認
3. ステータスが **Active** になっているか確認
4. **SSL/TLS** が有効になっているか確認

### 5. DNS 設定の確認

**`ERR_NAME_NOT_RESOLVED` が表示される場合**:

1. Cloudflare Dashboard → **DNS** → **Records** を確認
2. 手動で追加した CNAME レコードがある場合：
   - **削除してください**（Cloudflare Pages が自動で管理します）
3. **Custom domains** でドメインが追加されている場合：
   - Cloudflare Pages が自動で DNS レコードを作成します
   - 手動で追加したレコードと競合する可能性があります

### 6. 再デプロイの実行

1. **Deployments** タブで最新のデプロイメントを選択
2. **Retry deployment** をクリック
3. ビルドが完了するまで待つ（通常 5-10 分）
4. 完了後、再度アクセスして確認

### 7. プロジェクト設定の確認

1. **Settings** → **Builds & deployments** を確認
2. 以下の設定が正しいか確認：
   - **Build command**: `pnpm install && pnpm run build:cloudflare`
   - **Build output directory**: `.open-next`
   - **Production branch**: `main` または `master`
3. **Framework preset**: **Next.js** が選択されているか確認（**Next.js (Static HTML Export)** ではない）

### 8. 環境変数の確認

1. **Settings** → **Environment variables** を確認
2. 以下の環境変数が設定されているか確認：
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. 環境変数が設定されていない場合、Internal Server Error が発生する可能性があります

### 9. 最新のコードがプッシュされているか確認

1. GitHub リポジトリを確認
2. 最新のコミットがプッシュされているか確認
3. `package.json` に `build:cloudflare` スクリプトが含まれているか確認
4. `scripts/resolve-symlinks.js` が存在するか確認

### 10. ローカルでビルドをテスト

```bash
cd D:\Code\auriary
pnpm install
pnpm run build:cloudflare
```

- ビルドが成功するか確認
- `.open-next/worker.js` と `.open-next/_worker.js` が生成されているか確認
- エラーが発生する場合、そのエラーを解決してから再デプロイ

### 11. ブラウザのキャッシュをクリア

1. ブラウザのキャッシュを完全にクリア（Ctrl+Shift+Delete）
2. シークレットモード（プライベートモード）でアクセス
3. デベロッパーツール → Networkタブで「Disable cache」を有効にして再読み込み

### 12. 別のブラウザやデバイスで確認

- 異なるブラウザでアクセス
- モバイルデバイスでアクセス
- 別のネットワーク（例：スマートフォンのテザリング）でアクセス

### 13. Cloudflare のステータスを確認

1. [Cloudflare Status](https://www.cloudflarestatus.com/) を確認
2. Cloudflare Pages に問題がないか確認
3. 問題がある場合、解決まで待つ

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

