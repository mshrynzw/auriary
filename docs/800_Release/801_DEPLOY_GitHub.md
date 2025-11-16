# GitHub連携による自動デプロイ

このドキュメントでは、GitHub連携を使用してCloudflare Pagesに自動デプロイする手順を説明します。

この方法は、GitHubにコードをプッシュするたびに自動的にビルド・デプロイされます。

---

## ステップ1: GitHubにコードをプッシュ

1. GitHubでリポジトリを作成（まだの場合）
2. ローカルでGitを初期化（まだの場合）:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/auriary.git
   git push -u origin main
   ```

---

## ステップ2: Cloudflare Pagesでプロジェクトを作成

### 方法A: ナビゲーションからアクセス

1. [Cloudflare Dashboard](https://dash.cloudflare.com/)にログイン
2. 左サイドバーから「**Compute & AI**」セクションを展開
3. 「**Workers & Pages**」をクリック
4. ページ上部の「**Pages**」タブをクリック（「Workers」タブの隣）
5. 「**Import an existing Git repository**」の「**Get started**」ボタンをクリック
6. GitHubアカウントを認証・接続（まだ接続していない場合）
7. リポジトリ「**auriary**」を選択
8. 「**Begin setup**」をクリック

### 方法B: 直接URLでアクセス（簡単）

以下のURLに直接アクセスすることもできます：

1. [Cloudflare Pages](https://dash.cloudflare.com/?to=/:account/pages) にアクセス
2. ページ上部の「**Pages**」タブをクリック（「Workers」タブの隣）
3. 「**Import an existing Git repository**」の「**Get started**」ボタンをクリック
4. GitHubアカウントを認証・接続（まだ接続していない場合）
5. リポジトリ「**auriary**」を選択
6. 「**Begin setup**」をクリック

**重要**: 「Pages」タブを選択すると、2つのオプションが表示されます：
- 「**Import an existing Git repository**」- GitHubからインポート（こちらを選択）
- 「**Drag and drop your files**」- ファイルを直接アップロード（使用しない）

---

## ステップ3: ビルド設定

以下の設定を入力：

- **Project name**: `auriary`（任意の名前）
- **Production branch**: `main`（または`master`）
- **Build command**: `pnpm install && pnpm run build:cloudflare`
- **Build output directory**: `.open-next`

**重要**: Cloudflare Pagesはデフォルトで`npm`を使用しますが、このプロジェクトは`pnpm`を使用しています。以下の手順で`pnpm`を有効化する必要があります。

---

## ステップ4: 環境変数の設定

1. プロジェクト設定画面で「**Settings**」タブを選択
2. 「**Environment variables**」セクションを開く
3. 以下の環境変数を追加：

   ```
   NEXT_PUBLIC_SUPABASE_URL=あなたのSupabaseプロジェクトURL
   NEXT_PUBLIC_SUPABASE_ANON_KEY=あなたのSupabase Anon Key
   ```

   **注意**: 
   - `NEXT_PUBLIC_`で始まる変数はクライアントサイドで公開されます
   - 機密情報（Service Role Keyなど）は使用しないでください

4. 「**Save**」をクリック

---

## ステップ5: pnpmの有効化

Cloudflare Pagesで`pnpm`を使用するには、ビルド設定を変更する必要があります：

1. プロジェクト設定画面で「**Settings**」→「**Builds & deployments**」を選択
2. 「**Build configuration**」セクションで「**Add build environment variable**」をクリック
3. 以下を追加：
   - **Variable name**: `PNPM_VERSION`
   - **Value**: `8`（または最新バージョン）

   または、プロジェクトルートに`.nvmrc`ファイルを作成してNode.jsバージョンを指定することもできます。

---

## ステップ6: 初回デプロイ

1. 「**Save and Deploy**」をクリック
2. ビルドが開始されます（数分かかることがあります）
3. ビルドが完了すると、自動的にデプロイされます
4. デプロイされたURLは「**Deployments**」タブで確認できます

---

## ステップ7: カスタムドメインの設定（オプション）

1. 「**Settings**」→「**Custom domains**」を選択
2. 「**Set up a custom domain**」をクリック
3. ドメイン名を入力して設定

---

## 自動デプロイの仕組み

GitHub連携を設定すると、以下のタイミングで自動的にデプロイが実行されます：

- **Production branch**（`main`など）へのプッシュ → 本番環境にデプロイ
- **その他のブランチ**へのプッシュ → プレビューデプロイ（一時的なURLが生成される）
- **プルリクエスト**の作成 → プレビューデプロイ

---

## 関連ドキュメント

- [メインデプロイ手順書](./800_DEPLOY.md)
- [トラブルシューティング](./803_DEPLOY_Troubleshooting.md)
- [デプロイ前チェックリスト](./804_DEPLOY_Checklist.md)

