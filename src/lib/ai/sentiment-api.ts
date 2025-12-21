/**
 * Python Sentiment API クライアント
 * 日記本文の感情スコア（AI分析）を行う
 */

export interface HighlightedWord {
  word: string;
  sentiment: 'positive' | 'negative';
  score: number;
  position: number; // テキスト内の位置（文字位置）
}

export interface SentimentAnalysisResult {
  sentiment: 'positive' | 'neutral' | 'negative';
  score: number; // 1-10
  confidence: number; // 0.0-1.0
  highlighted_words: HighlightedWord[];
  overall_sentiment_score: number; // -1.0 ～ 1.0
  model_used?: string; // 使用されたモデル名（上級版）
}

const API_BASE_URL = process.env.NEXT_PUBLIC_SENTIMENT_API_URL || 'http://localhost:8000';

/**
 * テキストの感情スコア（AI分析）を実行
 */
export async function analyzeSentiment(text: string): Promise<SentimentAnalysisResult> {
  try {
    const response = await fetch(`${API_BASE_URL}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Sentiment analysis error:', error);
    // エラーを再スローして、呼び出し元で処理できるようにする
    throw error;
  }
}

/**
 * ヘルスチェック
 */
export async function checkSentimentAPIHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    if (!response.ok) {
      return false;
    }
    const data = await response.json();
    return data.status === 'ok';
  } catch (error) {
    console.error('Health check error:', error);
    return false;
  }
}
