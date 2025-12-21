# 感情分析API詳細設計書

## 概要

日記本文の感情分析を行うPython FastAPIサーバー。ネガポジ判定、感情スコア算出、注目ワード抽出を提供します。

---

## アーキテクチャ

```
┌─────────────────┐
│   Next.js App   │
│   (Frontend)    │
└────────┬────────┘
         │ HTTP Request
         │ POST /analyze
         ▼
┌─────────────────┐
│  Sentiment API  │
│  (FastAPI)      │
│  Port: 8000     │
└────────┬────────┘
         │
         ├─ 基本版: 辞書ベース
         ├─ 中級版: Janome (形態素解析)
         └─ 上級版: Transformers (機械学習)
```

---

## 実装段階

### 段階1: 基本版（辞書ベース）

**目的:** 最小限の実装で動作確認

**特徴:**

- 辞書ベースの感情分析
- シンプルな実装
- 依存関係が少ない
- 高速なレスポンス

**技術スタック:**

- FastAPI
- Python標準ライブラリ（re, typing）

**精度:**

- 基本的なポジティブ/ネガティブ判定
- 感情辞書の拡張により改善可能

---

### 段階2: 中級版（Janome使用）

**目的:** 形態素解析による精度向上

**特徴:**

- 日本語形態素解析（Janome）
- 活用形の統一処理
- より正確な単語抽出

**技術スタック:**

- FastAPI
- Janome（形態素解析）

**精度:**

- 形態素解析による単語認識の向上
- 活用形の統一により辞書マッチングが改善

**追加依存関係:**

```txt
janome==0.5.0
```

---

### 段階3: 上級版（Transformers使用）

**目的:** 機械学習モデルによる高精度な感情分析

**特徴:**

- 事前学習済み日本語BERTモデル
- 文脈を考慮した感情分析
- より高精度なスコア算出

**技術スタック:**

- FastAPI
- Transformers（Hugging Face）
- PyTorch
- 日本語BERTモデル（例: `daigo/bert-base-japanese-sentiment`）

**精度:**

- 機械学習による高精度な分析
- 文脈を理解した感情判定

**追加依存関係:**

```txt
torch>=2.0.0
transformers>=4.30.0
numpy>=1.24.0
```

---

## API仕様

### エンドポイント

#### POST /analyze

テキストの感情分析を実行します。

**リクエスト:**

```json
{
  "text": "今日はとても楽しい一日でした。"
}
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

**フィールド説明:**

- `sentiment`: `"positive" | "neutral" | "negative"`
- `score`: 1-10の感情スコア
- `confidence`: 0.0-1.0の信頼度
- `highlighted_words`: 注目ワードのリスト
- `overall_sentiment_score`: -1.0～1.0の正規化スコア

#### GET /health

ヘルスチェックエンドポイント。

**レスポンス:**

```json
{
  "status": "ok",
  "timestamp": "2025-01-16T12:00:00"
}
```

---

## データモデル

### AnalyzeRequest

```python
class AnalyzeRequest(BaseModel):
    text: str  # 分析対象のテキスト
```

### HighlightedWord

```python
class HighlightedWord(BaseModel):
    word: str  # 注目ワード
    sentiment: str  # "positive" | "negative"
    score: float  # 感情スコア
    position: int  # テキスト内の位置（中級版以降）
```

### AnalyzeResponse

```python
class AnalyzeResponse(BaseModel):
    sentiment: str  # "positive" | "neutral" | "negative"
    score: int  # 1-10の感情スコア
    confidence: float  # 0.0-1.0の信頼度
    highlighted_words: List[HighlightedWord]
    overall_sentiment_score: float  # -1.0～1.0
    model_used: Optional[str] = None  # 使用モデル（上級版）
```

---

## 感情辞書

### ポジティブワード

**形容詞:**

- 良い、楽しい、嬉しい、幸せ、素晴らしい、最高、快適、心地よい
- 爽快、清々しい、優しい、親切、温かい、穏やか、元気、健康

**名詞:**

- 感謝、希望、期待、興奮、感動、感激、愛、喜び、笑顔
- 成功、達成、成長、進歩、改善、向上

**動詞:**

- 楽しむ、笑う、感謝する、愛する、好き、大好き

### ネガティブワード

**形容詞:**

- 悪い、悲しい、辛い、苦しい、痛い、怖い、恐ろしい、嫌
- 寂しい、虚しい、無力、だるい、しんどい、疲れた

**名詞:**

- 苦痛、痛み、苦しみ、不安、心配、恐れ、恐怖、怒り
- ストレス、緊張、焦り、憂鬱、失望、絶望、孤独、疲労
- 倦怠、失敗、挫折、後悔

**動詞:**

- 嫌い、憎い、怒る、落ち込む、焦る

---

## スコア算出ロジック

### 基本版・中級版

1. ポジティブ/ネガティブワードの出現回数をカウント
2. `overall_score = (positive_count - negative_count) / total_words`
3. `overall_score`を-1.0～1.0に正規化
4. 1-10スコアに変換: `score = int(5 + overall_score * 5)`

### 上級版

1. 機械学習モデルで推論
2. クラス確率を取得
3. 最大確率のクラスを感情として判定
4. 確率を1-10スコアに変換

---

## デプロイ戦略

### 開発環境

```bash
cd sentiment-api
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

### 本番環境

**推奨ホスティング:**

- Railway
- Render
- Fly.io
- AWS Lambda（Serverless）
- Google Cloud Run

**環境変数:**

```env
PORT=8000
HOST=0.0.0.0
```

---

## セキュリティ

### CORS設定

開発環境:

```python
allow_origins=["http://localhost:3000", "http://localhost:3001"]
```

本番環境:

```python
allow_origins=["https://yourdomain.com"]
```

### レート制限

将来的に実装予定:

- リクエスト数制限
- IPベースの制限

---

## パフォーマンス

### レスポンス時間目標

- 基本版: < 100ms
- 中級版: < 500ms
- 上級版: < 2000ms（初回モデル読み込み除く）

### 最適化

- モデルのキャッシング（上級版）
- 非同期処理の活用
- バッチ処理の検討

---

## エラーハンドリング

### エラーレスポンス

```json
{
  "detail": "エラーメッセージ"
}
```

### エラーコード

- `400`: 不正なリクエスト
- `500`: サーバーエラー
- `503`: サービス利用不可（モデル読み込み中など）

---

## 移行ガイド

### 基本版 → 中級版

1. `janome`をインストール
2. `main.py`を`main_janome.py`に置き換え
3. 形態素解析ロジックを統合
4. テスト実行

### 中級版 → 上級版

1. `torch`、`transformers`をインストール
2. 日本語BERTモデルをダウンロード
3. `main.py`を`main_transformers.py`に置き換え
4. モデル読み込み時間を考慮した起動処理を実装
5. テスト実行

---

## テスト戦略

### ユニットテスト

- 感情辞書のマッチングテスト
- スコア算出ロジックのテスト
- エラーハンドリングのテスト

### 統合テスト

- APIエンドポイントのテスト
- 実際の日記テキストでのテスト

### パフォーマンステスト

- レスポンス時間の測定
- 同時リクエストの処理能力

---

## 今後の拡張

- [ ] 感情辞書の拡張（ユーザーカスタマイズ可能に）
- [ ] 複数言語対応
- [ ] 感情の時系列分析
- [ ] トピック抽出の強化
- [ ] カスタムモデルの学習

---

## 関連ドキュメント

- [API設計書](./206_DetailedDesign_API.md)
- [機能設計書](./204_DetailedDesign_Functions.md)
- [アーキテクチャ設計書](./202_DetailedDesign_Architecture.md)
