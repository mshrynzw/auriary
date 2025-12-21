# Railway デプロイ手順書

このドキュメントでは、Auriary Sentiment Analysis APIをRailwayにデプロイする手順を説明します。

## ⚡ クイックスタート（5分でデプロイ）

1. **Railwayアカウントを作成**
   - [Railway](https://railway.app) にアクセス
   - GitHubアカウントでサインアップ

2. **新しいプロジェクトを作成**
   - Railway Dashboard → 「**New Project**」
   - 「**Deploy from GitHub repo**」を選択

3. **リポジトリを選択**
   - GitHubリポジトリを選択
   - ルートディレクトリを `sentiment-api` に設定

4. **環境変数を設定**
   - Railway Dashboard → プロジェクト → **Variables**
   - `ALLOWED_ORIGINS` を追加（本番環境のURL）

5. **デプロイ完了**
   - 自動的にビルドとデプロイが開始されます
   - 初回はモデルのダウンロードに数分かかります

---

## 📋 前提条件

- GitHubアカウント（コードをホスティングするため）
- Railwayアカウント（無料で作成可能）
- 本番環境のURL（CORS設定用）

---

## 📚 詳細手順

### 1. Railwayアカウントの作成

1. [Railway](https://railway.app) にアクセス
2. 「**Start a New Project**」をクリック
3. GitHubアカウントでサインアップ（推奨）

### 2. プロジェクトの作成

1. Railway Dashboard → 「**New Project**」
2. 「**Deploy from GitHub repo**」を選択
3. GitHubリポジトリを選択
4. プロジェクト名を入力（例: `auriary-sentiment-api`）

### 3. サービス設定

1. 作成されたサービスをクリック
2. **Settings** → **Source** で以下を確認：
   - **Root Directory**: `sentiment-api`
   - **Build Command**: 自動検出（`pip install -r requirements.txt`）
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`

### 4. 環境変数の設定

Railway Dashboard → プロジェクト → **Variables** で以下を設定：

#### 必須環境変数

- `ALLOWED_ORIGINS`
  - 許可するオリジン（カンマ区切り）
  - 例: `https://yourdomain.com,https://www.yourdomain.com`
  - 開発環境: `http://localhost:3000,http://localhost:3001`

#### オプション環境変数

- `PORT`
  - ポート番号（デフォルト: Railwayが自動設定）
  - 通常は設定不要

- `HOST`
  - ホスト（デフォルト: `0.0.0.0`）
  - 通常は設定不要

### 5. リソース設定

1. Railway Dashboard → プロジェクト → **Settings** → **Resources**
2. **Memory** を設定：
   - 最低: **2GB**（推奨: **4GB以上**）
   - BERTモデルは約500MBのメモリを使用します

3. **CPU** を設定：
   - デフォルトで問題ありません
   - GPUは利用できません（CPUのみ）

### 6. デプロイの確認

1. Railway Dashboard → **Deployments** でデプロイ状況を確認
2. ログを確認：
   - 「**View Logs**」をクリック
   - モデルのダウンロード状況を確認
   - `Model loaded on cpu` と表示されれば成功

3. デプロイされたURLを確認：
   - Railway Dashboard → **Settings** → **Networking**
   - **Public Domain** が自動生成されます
   - 例: `https://auriary-sentiment-api-production.up.railway.app`

### 7. 動作確認

```bash
# ヘルスチェック
curl https://your-railway-url.railway.app/health

# 感情分析テスト
curl -X POST "https://your-railway-url.railway.app/analyze" \
  -H "Content-Type: application/json" \
  -d '{"text": "今日はとても楽しい一日でした。"}'
```

---

## 🔧 Next.jsアプリとの連携

### 環境変数の設定

Next.jsアプリ（Vercel）の環境変数に以下を追加：

```
NEXT_PUBLIC_SENTIMENT_API_URL=https://your-railway-url.railway.app
```

### CORS設定の確認

Railwayの環境変数 `ALLOWED_ORIGINS` に、Next.jsアプリのURLを含める：

```
ALLOWED_ORIGINS=https://your-nextjs-app.vercel.app,https://yourdomain.com
```

---

## 💰 料金

### 無料プラン

- **$5/月のクレジット**（約500時間の実行時間）
- 個人プロジェクトには十分

### 有料プラン

- **Hobby**: $5/月（$5のクレジット + 追加使用分）
- **Pro**: $20/月（より多くのリソース）

---

## 🔄 CI/CDの設定

RailwayはGitHubと連携することで、自動的にCI/CDが設定されます。

### 自動デプロイの仕組み

- **プッシュ時の自動デプロイ**: `main`（または`master`）ブランチへのプッシュで自動デプロイ
- **プルリクエスト**: プルリクエストごとにプレビューデプロイが作成されます（オプション）
- **ビルドログ**: Railway Dashboardでビルドログを確認できます

---

## 🐛 トラブルシューティング

### ビルドエラー

**問題**: 依存関係のインストールに失敗する

**解決方法**:
1. Railway Dashboard → **Deployments** → 失敗したデプロイを確認
2. ログでエラーメッセージを確認
3. `requirements.txt` が正しいか確認

### メモリ不足

**問題**: モデルの読み込みに失敗する

**解決方法**:
1. Railway Dashboard → **Settings** → **Resources**
2. **Memory** を **4GB以上** に増やす

### CORSエラー

**問題**: Next.jsアプリからAPIにアクセスできない

**解決方法**:
1. Railway Dashboard → **Variables** で `ALLOWED_ORIGINS` を確認
2. Next.jsアプリのURLが含まれているか確認
3. プロトコル（http/https）が一致しているか確認

### モデルのダウンロードに時間がかかる

**問題**: 初回起動に時間がかかる

**解決方法**:
- 初回起動時はモデルのダウンロードに数分かかります
- これは正常な動作です
- 2回目以降はキャッシュから読み込まれるため高速です

### タイムアウトエラー

**問題**: リクエストがタイムアウトする

**解決方法**:
1. Railway Dashboard → **Settings** → **Resources**
2. **CPU** を増やす
3. または、中級版（Janome）に戻すことを検討

### 404エラー（Not Found）

**問題**: `/health` や `/analyze` エンドポイントにアクセスすると404エラーが返る

**確認事項**:
1. **Root Directoryの設定を確認**
   - Railway Dashboard → プロジェクト → **Settings** → **Source**
   - **Root Directory** が `sentiment-api` に設定されているか確認
   - 設定されていない場合は `sentiment-api` に変更して再デプロイ

2. **デプロイの状態を確認**
   - Railway Dashboard → **Deployments** で最新のデプロイを確認
   - デプロイが成功しているか確認（緑色のチェックマーク）
   - 失敗している場合はログを確認

3. **ログを確認**
   - Railway Dashboard → **Deployments** → 最新のデプロイ → 「**View Logs**」
   - 以下のメッセージが表示されているか確認：
     - `Loading model: christian-phu/bert-finetuned-japanese-sentiment...`
     - `Model loaded on cpu`
     - `Application startup complete`
   - エラーメッセージがないか確認

4. **アプリケーションの起動を確認**
   - ログに `Uvicorn running on http://0.0.0.0:PORT` と表示されているか確認
   - ポート番号が正しく設定されているか確認

5. **Public Domainの確認**
   - Railway Dashboard → **Settings** → **Networking**
   - **Public Domain** が正しく設定されているか確認
   - カスタムドメインを使用している場合は、正しく設定されているか確認

**解決方法**:
- Root Directoryが正しく設定されていない場合：
  1. Railway Dashboard → プロジェクト → **Settings** → **Source**
  2. **Root Directory** を `sentiment-api` に設定
  3. 「**Save**」をクリック
  4. 自動的に再デプロイが開始されます

- デプロイが失敗している場合：
  1. ログを確認してエラーの原因を特定
  2. メモリ不足の場合は、**Settings** → **Resources** でメモリを増やす
  3. 依存関係のエラーの場合は、`requirements.txt` を確認

---

## 📊 モニタリング

### ログの確認

1. Railway Dashboard → **Deployments** → デプロイを選択
2. 「**View Logs**」をクリック
3. リアルタイムでログを確認できます

### メトリクスの確認

1. Railway Dashboard → **Metrics**
2. CPU、メモリ、ネットワークの使用状況を確認

---

## 🔐 セキュリティ

### 環境変数の管理

- 機密情報は環境変数で管理
- Railway Dashboard → **Variables** で設定
- `.env` ファイルはGitにコミットしない（`.gitignore`に含まれています）

### CORS設定

- `ALLOWED_ORIGINS` に信頼できるオリジンのみを指定
- ワイルドカード（`*`）は使用しない

---

## 📝 デプロイ前チェックリスト

- [ ] GitHubリポジトリにコードがプッシュされている
- [ ] `requirements.txt` が最新である
- [ ] `railway.json` が存在する
- [ ] 環境変数 `ALLOWED_ORIGINS` が設定されている
- [ ] メモリが2GB以上に設定されている
- [ ] Next.jsアプリの環境変数 `NEXT_PUBLIC_SENTIMENT_API_URL` が設定されている

---

## 📖 参考リンク

- [Railway ドキュメント](https://docs.railway.app)
- [Railway デプロイメント](https://docs.railway.app/deploy/builds)
- [FastAPI デプロイメント](https://fastapi.tiangolo.com/deployment/)
- [Python デプロイメント](https://docs.railway.app/deploy/python)

---

## 🎉 デプロイ完了後

デプロイが完了したら、以下を確認してください：

1. **ヘルスチェック**: `/health` エンドポイントにアクセス
2. **API動作確認**: `/analyze` エンドポイントでテスト
3. **Next.jsアプリとの連携**: 日記作成・編集で感情分析が動作するか確認

問題が発生した場合は、ログを確認してトラブルシューティングセクションを参照してください。
