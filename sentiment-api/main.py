"""
Auriary Sentiment Analysis API - 上級版（Transformers使用）

段階3: 機械学習モデルによる高精度な感情分析
- 事前学習済み日本語BERTモデル
- 文脈を考慮した感情分析
- より高精度なスコア算出
"""

import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import numpy as np
from janome.tokenizer import Tokenizer

app = FastAPI(title="Auriary Sentiment Analysis API")

# 環境変数から設定を読み込み
ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://localhost:3001"
).split(",")
PORT = int(os.getenv("PORT", "8000"))
HOST = os.getenv("HOST", "0.0.0.0")

# CORS設定（環境変数から読み込み）
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# モデル設定
# 日本語感情分析モデル（ポジティブ、ニュートラル、ネガティブの3クラス分類）
MODEL_NAME = "christian-phu/bert-finetuned-japanese-sentiment"
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# モデルとトークナイザーの読み込み（起動時に1回だけ）
print(f"Loading model: {MODEL_NAME}...")
tokenizer_bert = AutoTokenizer.from_pretrained(MODEL_NAME)
model = AutoModelForSequenceClassification.from_pretrained(MODEL_NAME)
model.to(device)
model.eval()
print(f"Model loaded on {device}")

# Janome Tokenizerの初期化（注目ワード抽出用）
janome_tokenizer = Tokenizer()

# リクエスト/レスポンスモデル
class AnalyzeRequest(BaseModel):
    text: str


class HighlightedWord(BaseModel):
    word: str
    sentiment: str  # 'positive' or 'negative'
    score: float  # 感情スコア（-1.0 ～ 1.0）
    position: int  # テキスト内の位置（文字位置）


class AnalyzeResponse(BaseModel):
    sentiment: str  # 'positive', 'neutral', 'negative'
    score: int  # 1-10の感情スコア
    confidence: float  # 0.0-1.0
    highlighted_words: List[HighlightedWord]
    overall_sentiment_score: float  # -1.0 ～ 1.0
    model_used: Optional[str] = MODEL_NAME


# 感情辞書（注目ワード抽出用）
POSITIVE_WORDS = {
    '良い', 'よい', 'いい', '楽しい', '嬉しい', 'うれしい', '幸せ', 'しあわせ',
    '素晴らしい', 'すばらしい', '最高', '快適', '心地よい', 'ここちよい',
    '爽快', '清々しい', 'すがすがしい', '優しい', 'やさしい', '親切',
    '温かい', 'あたたかい', '穏やか', 'おだやか', '元気', '健康',
    '感謝', '希望', '期待', '興奮', '感動', '感激', '愛', '喜び', 'よろこび',
    '笑顔', 'えがお', '成功', '達成', '成長', '進歩', '改善', '向上',
    '楽しむ', '笑う', '感謝する', '愛する', '好き', '大好き', '愛してる',
    'ありがとう', '充実', '満足', '安心', '前向き', '積極的', 'ワクワク', 'ドキドキ',
}

NEGATIVE_WORDS = {
    '悪い', 'わるい', '悲しい', 'かなしい', '辛い', 'つらい', '苦しい', 'くるしい',
    '痛い', 'いたい', '怖い', 'こわい', '恐ろしい', 'おそろしい', '嫌', 'いや',
    '寂しい', 'さびしい', '虚しい', 'むなしい', '無力', 'だるい', 'しんどい',
    '疲れた', 'つかれた', '苦痛', '痛み', 'いたみ', '苦しみ', 'くるしみ',
    '不安', '心配', '恐れ', 'おそれ', '恐怖', '怒り', 'いかり', 'ストレス',
    '緊張', '焦り', 'あせり', '憂鬱', 'ゆううつ', '失望', '絶望', '孤独',
    '疲労', '倦怠', '失敗', '挫折', '後悔', '嫌い', '憎い', 'にくい', '怒る',
    '落ち込む', '焦る', '疲れ', 'つかれ', 'イライラ', '無力感', '後ろ向き',
    '消極的', '無気力', 'やる気がない',
}


def extract_highlighted_words(text: str) -> List[HighlightedWord]:
    """
    Janomeを使用して注目ワードを抽出
    """
    if not text or not text.strip():
        return []

    tokens = list(janome_tokenizer.tokenize(text))
    highlighted_words: List[HighlightedWord] = []
    current_position = 0

    for token in tokens:
        surface = token.surface
        base_form = token.base_form if token.base_form != '*' else surface
        check_words = {base_form, surface}

        # ポジティブワードのチェック
        for word in check_words:
            if word in POSITIVE_WORDS:
                pos = text.find(surface, current_position)
                if pos != -1:
                    highlighted_words.append(
                        HighlightedWord(
                            word=surface,
                            sentiment='positive',
                            score=0.7,
                            position=pos
                        )
                    )
                    current_position = pos + len(surface)
                break

        # ネガティブワードのチェック
        for word in check_words:
            if word in NEGATIVE_WORDS:
                pos = text.find(surface, current_position)
                if pos != -1:
                    highlighted_words.append(
                        HighlightedWord(
                            word=surface,
                            sentiment='negative',
                            score=-0.7,
                            position=pos
                        )
                    )
                    current_position = pos + len(surface)
                break

    # 重複を除去
    seen = set()
    unique_words = []
    for word_obj in highlighted_words:
        key = (word_obj.word, word_obj.position)
        if key not in seen:
            seen.add(key)
            unique_words.append(word_obj)

    return unique_words


def analyze_sentiment(text: str) -> AnalyzeResponse:
    """
    テキストの感情分析を実行（Transformers版）
    """
    if not text or not text.strip():
        return AnalyzeResponse(
            sentiment='neutral',
            score=5,
            confidence=0.0,
            highlighted_words=[],
            overall_sentiment_score=0.0,
            model_used=MODEL_NAME,
        )

    # BERTモデルで感情分析
    inputs = tokenizer_bert(
        text,
        return_tensors="pt",
        truncation=True,
        max_length=512,
        padding=True
    )
    inputs = {k: v.to(device) for k, v in inputs.items()}

    with torch.no_grad():
        outputs = model(**inputs)
        logits = outputs.logits
        probabilities = torch.nn.functional.softmax(logits, dim=-1)
        probabilities = probabilities.cpu().numpy()[0]

    # モデルの出力クラス（christian-phu/bert-finetuned-japanese-sentimentの場合）
    # 3クラス分類: [negative, neutral, positive] の順
    predicted_class = np.argmax(probabilities)
    confidence = float(probabilities[predicted_class])

    # クラスラベルのマッピング
    # christian-phu/bert-finetuned-japanese-sentimentは [negative, neutral, positive] の順
    num_classes = len(probabilities)
    
    if num_classes == 2:
        # 2クラスの場合: [negative, positive]
        class_labels = ['negative', 'positive']
        sentiment = class_labels[predicted_class]
        overall_score = probabilities[1] - probabilities[0]  # positive - negative
    elif num_classes >= 3:
        # 3クラスの場合: [negative, neutral, positive]
        class_labels = ['negative', 'neutral', 'positive']
        sentiment = class_labels[predicted_class]
        # negative: -1.0, neutral: 0.0, positive: 1.0
        overall_score = probabilities[2] - probabilities[0]  # positive - negative
    else:
        # フォールバック
        sentiment = 'neutral'
        overall_score = 0.0

    # 1-10スコアに変換
    score = int(5 + overall_score * 5)
    score = max(1, min(10, score))

    # 注目ワードの抽出（Janomeを使用）
    highlighted_words = extract_highlighted_words(text)

    return AnalyzeResponse(
        sentiment=sentiment,
        score=score,
        confidence=confidence,
        highlighted_words=highlighted_words,
        overall_sentiment_score=overall_score,
        model_used=MODEL_NAME,
    )


@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze_text(request: AnalyzeRequest):
    """
    テキストの感情分析を実行
    """
    try:
        result = analyze_sentiment(request.text)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
async def health_check():
    """
    ヘルスチェック
    """
    return {
        "status": "ok",
        "timestamp": datetime.now().isoformat(),
        "model": MODEL_NAME,
        "device": str(device),
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host=HOST, port=PORT)
