"""
Auriary Sentiment Analysis API - 基本版（辞書ベース）

段階1: 辞書ベースの感情分析
- シンプルで高速
- 最小限の依存関係
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import re
from datetime import datetime

app = FastAPI(title="Auriary Sentiment Analysis API")

# CORS設定
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# リクエスト/レスポンスモデル
class AnalyzeRequest(BaseModel):
    text: str


class HighlightedWord(BaseModel):
    word: str
    sentiment: str  # 'positive' or 'negative'
    score: float  # 感情スコア（-1.0 ～ 1.0）


class AnalyzeResponse(BaseModel):
    sentiment: str  # 'positive', 'neutral', 'negative'
    score: int  # 1-10の感情スコア
    confidence: float  # 0.0-1.0
    highlighted_words: List[HighlightedWord]
    overall_sentiment_score: float  # -1.0 ～ 1.0


# 拡張された感情辞書
POSITIVE_WORDS = {
    # 形容詞
    '良い',
    '楽しい',
    '嬉しい',
    '幸せ',
    '素晴らしい',
    '最高',
    '快適',
    '心地よい',
    '爽快',
    '清々しい',
    '優しい',
    '親切',
    '温かい',
    '穏やか',
    '元気',
    '健康',
    # 名詞
    '感謝',
    '希望',
    '期待',
    '興奮',
    '感動',
    '感激',
    '愛',
    '喜び',
    '笑顔',
    '成功',
    '達成',
    '成長',
    '進歩',
    '改善',
    '向上',
    # 動詞
    '楽しむ',
    '笑う',
    '感謝する',
    '愛する',
    '好き',
    '大好き',
    '愛してる',
    # その他
    'ありがとう',
    '充実',
    '満足',
    '安心',
    '前向き',
    '積極的',
    'ワクワク',
    'ドキドキ',
}

NEGATIVE_WORDS = {
    # 形容詞
    '悪い',
    '悲しい',
    '辛い',
    '苦しい',
    '痛い',
    '怖い',
    '恐ろしい',
    '嫌',
    '寂しい',
    '虚しい',
    '無力',
    'だるい',
    'しんどい',
    '疲れた',
    # 名詞
    '苦痛',
    '痛み',
    '苦しみ',
    '不安',
    '心配',
    '恐れ',
    '恐怖',
    '怒り',
    'ストレス',
    '緊張',
    '焦り',
    '憂鬱',
    '失望',
    '絶望',
    '孤独',
    '疲労',
    '倦怠',
    '失敗',
    '挫折',
    '後悔',
    # 動詞
    '嫌い',
    '憎い',
    '怒る',
    '落ち込む',
    '焦る',
    # その他
    '疲れ',
    'イライラ',
    '無力感',
    '後ろ向き',
    '消極的',
    '無気力',
    'やる気がない',
}


def analyze_sentiment(text: str) -> AnalyzeResponse:
    """
    テキストの感情分析を実行（辞書ベース）
    """
    text_lower = text.lower()

    # ポジティブ/ネガティブワードの検出
    positive_count = sum(1 for word in POSITIVE_WORDS if word in text)
    negative_count = sum(1 for word in NEGATIVE_WORDS if word in text)

    # 注目ワードの抽出（感情が強い単語）
    highlighted_words: List[HighlightedWord] = []

    # ポジティブワードの抽出
    for word in POSITIVE_WORDS:
        if word in text:
            # テキスト内の出現位置を検出
            pattern = re.compile(re.escape(word), re.IGNORECASE)
            matches = pattern.finditer(text)
            for match in matches:
                highlighted_words.append(
                    HighlightedWord(word=word, sentiment='positive', score=0.7)
                )

    # ネガティブワードの抽出
    for word in NEGATIVE_WORDS:
        if word in text:
            pattern = re.compile(re.escape(word), re.IGNORECASE)
            matches = pattern.finditer(text)
            for match in matches:
                highlighted_words.append(
                    HighlightedWord(word=word, sentiment='negative', score=-0.7)
                )

    # 重複を除去（同じ単語が複数回出現する場合）
    seen = set()
    unique_words = []
    for word_obj in highlighted_words:
        if word_obj.word not in seen:
            seen.add(word_obj.word)
            unique_words.append(word_obj)

    # 感情スコアの計算
    total_words = len(text.split())
    if total_words == 0:
        overall_score = 0.0
    else:
        overall_score = (positive_count - negative_count) / total_words
    overall_score = max(-1.0, min(1.0, overall_score))

    # 感情判定
    if overall_score > 0.1:
        sentiment = 'positive'
        score = int(5 + overall_score * 5)  # 5-10に変換
    elif overall_score < -0.1:
        sentiment = 'negative'
        score = int(5 + overall_score * 5)  # 0-5に変換
    else:
        sentiment = 'neutral'
        score = 5

    # 信頼度の計算
    total_detected = positive_count + negative_count
    confidence = min(1.0, total_detected / max(total_words * 0.1, 1))

    return AnalyzeResponse(
        sentiment=sentiment,
        score=score,
        confidence=confidence,
        highlighted_words=unique_words,
        overall_sentiment_score=overall_score,
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
    return {"status": "ok", "timestamp": datetime.now().isoformat()}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
