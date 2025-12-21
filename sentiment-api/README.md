# Auriary Sentiment Analysis API

日記本文の感情分析を行うPython FastAPIサーバー。

## 📋 機能

- **ネガポジ判定**: テキストの感情をポジティブ/ネガティブ/ニュートラルに分類
- **感情スコア算出**: 1-10のスケールで感情スコアを算出
- **注目ワード抽出**: 感情が強い単語を抽出し、きらめき表示用のデータを提供

## 🚀 クイックスタート

### 前提条件

- Python 3.10以上
- pip

### セットアップ

```bash
# 仮想環境の作成
python -m venv venv

# 仮想環境の有効化
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# 依存関係のインストール
pip install -r requirements.txt
```

### 起動

```bash
# 基本版
python main.py

# または uvicorn を使用
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

サーバーは `http://localhost:8000` で起動します。

## 📚 実装段階

このAPIは3つの段階で実装されます：

### 段階1: 基本版（辞書ベース）✅

**現在の実装**

- 辞書ベースの感情分析
- シンプルで高速
- 最小限の依存関係

**ファイル:** `main.py`

### 段階2: 中級版（Janome使用）🔄

**予定**

- 形態素解析による精度向上
- 活用形の統一処理

**ファイル:** `main_janome.py`（実装予定）

**追加インストール:**

```bash
pip install janome
```

### 段階2への移行方法

1. `requirements.txt`に`janome==0.5.0`を追加
2. `pip install -r requirements.txt`
3. `main.py`を`main_janome.py`の内容に置き換え
4. サーバーを再起動

### 段階3: 上級版（Transformers使用）🔄

**予定**

- 機械学習モデルによる高精度な分析
- 文脈を考慮した感情判定

**ファイル:** `main_transformers.py`（実装予定）

**追加インストール:**

```bash
pip install torch transformers numpy
```

**モデル:**

- `daigo/bert-base-japanese-sentiment`（推奨）
- または他の日本語BERTモデル

### 段階3への移行方法

1. `requirements.txt`に以下を追加:
   ```txt
   torch>=2.0.0
   transformers>=4.30.0
   numpy>=1.24.0
   ```
2. `pip install -r requirements.txt`
3. `main.py`を`main_transformers.py`の内容に置き換え
4. 初回起動時にモデルがダウンロードされます（時間がかかります）
5. サーバーを再起動

## 📡 API仕様

### POST /analyze

テキストの感情分析を実行します。

**リクエスト:**

```bash
curl -X POST "http://localhost:8000/analyze" \
  -H "Content-Type: application/json" \
  -d '{"text": "今日はとても楽しい一日でした。"}'
```

**レスポンス:**

```json
{
  "sentiment": "positive",
  "score": 8,
  "confidence": 0.85,
  "highlighted_words": [
    {
      "word": "楽しい",
      "sentiment": "positive",
      "score": 0.7
    }
  ],
  "overall_sentiment_score": 0.6
}
```

### GET /health

ヘルスチェックエンドポイント。

**リクエスト:**

```bash
curl "http://localhost:8000/health"
```

**レスポンス:**

```json
{
  "status": "ok",
  "timestamp": "2025-01-16T12:00:00"
}
```

## 🔧 設定

### 環境変数

`.env`ファイルを作成（オプション）:

```env
PORT=8000
HOST=0.0.0.0
```

### CORS設定

`main.py`のCORS設定を編集:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Next.jsのURL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## 🧪 テスト

### 手動テスト

```bash
# ヘルスチェック
curl http://localhost:8000/health

# 感情分析
curl -X POST "http://localhost:8000/analyze" \
  -H "Content-Type: application/json" \
  -d '{"text": "今日は良い天気でした。"}'
```

### 自動テスト（実装予定）

```bash
pytest tests/
```

## 📦 デプロイ

### Railway

1. Railwayアカウントを作成
2. 新しいプロジェクトを作成
3. GitHubリポジトリを接続
4. ルートディレクトリを`sentiment-api`に設定
5. 環境変数を設定（必要に応じて）
6. デプロイ

### Render

1. Renderアカウントを作成
2. 新しいWeb Serviceを作成
3. GitHubリポジトリを接続
4. 設定:
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. デプロイ

### Fly.io

1. Fly.io CLIをインストール
2. `fly launch`を実行
3. `fly.toml`を設定
4. `fly deploy`を実行

## 📖 詳細ドキュメント

- [詳細設計書](../../docs/202_DetailedDesign/211_DetailedDesign_SentimentAPI.md)

## 🐛 トラブルシューティング

### ポートが既に使用されている

```bash
# 別のポートを使用
uvicorn main:app --port 8001
```

### モデルの読み込みに失敗する（上級版）

- インターネット接続を確認
- モデル名が正しいか確認
- 十分なメモリがあるか確認

### CORSエラー

- `allow_origins`に正しいURLが設定されているか確認
- プロトコル（http/https）が一致しているか確認

## 📝 ライセンス

このプロジェクトはAGPL-3.0ライセンスの下で公開されています。
