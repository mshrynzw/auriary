/**
 * AI機能のモック実装
 * OpenAI API キーが設定されていない場合に使用
 */

export interface AIAnalysisResult {
  sentiment: 'positive' | 'neutral' | 'negative';
  score: number; // 1-10
  confidence: number; // 0.0-1.0
  topics: string[];
  summary: string;
}

/**
 * 感情分析（モック）
 */
export async function analyzeSentimentMock(text: string): Promise<AIAnalysisResult> {
  // モック実装：テキストの長さと内容に基づいてダミーデータを返す
  const wordCount = text.length;
  const hasPositiveWords = /良い|楽しい|嬉しい|幸せ|感謝/.test(text);
  const hasNegativeWords = /悪い|悲しい|辛い|苦しい|疲れた/.test(text);

  let sentiment: 'positive' | 'neutral' | 'negative' = 'neutral';
  let score = 5;

  if (hasPositiveWords && !hasNegativeWords) {
    sentiment = 'positive';
    score = 7 + Math.floor(Math.random() * 3); // 7-9
  } else if (hasNegativeWords && !hasPositiveWords) {
    sentiment = 'negative';
    score = 2 + Math.floor(Math.random() * 3); // 2-4
  } else {
    score = 4 + Math.floor(Math.random() * 3); // 4-6
  }

  // トピック抽出（モック）
  const topics: string[] = [];
  if (/仕事|職場|会社/.test(text)) topics.push('仕事');
  if (/家族|親|子/.test(text)) topics.push('家族');
  if (/健康|体調|病気/.test(text)) topics.push('健康');
  if (/趣味|読書|映画|音楽/.test(text)) topics.push('趣味');
  if (/食事|料理|レストラン/.test(text)) topics.push('食事');
  if (topics.length === 0) topics.push('日常');

  // 要約生成（モック）
  const summary = text.length > 100 ? text.substring(0, 100) + '...' : text;

  return {
    sentiment,
    score,
    confidence: 0.7 + Math.random() * 0.2, // 0.7-0.9
    topics,
    summary,
  };
}

/**
 * 文章補完（モック）
 */
export async function completeTextMock(text: string): Promise<string> {
  // モック実装：テキストの最後の文に基づいて補完
  const sentences = text.split(/[。！？\n]/).filter((s) => s.trim());
  const lastSentence = sentences[sentences.length - 1] || '';

  if (lastSentence.includes('今日')) {
    return lastSentence + 'とても充実した一日でした。';
  } else if (lastSentence.includes('明日')) {
    return lastSentence + '楽しみにしています。';
  } else if (lastSentence.includes('仕事')) {
    return lastSentence + '頑張りました。';
  } else {
    return lastSentence + '良い一日でした。';
  }
}

/**
 * トピック抽出（モック）
 */
export async function extractTopicsMock(text: string): Promise<string[]> {
  const topics: string[] = [];
  if (/仕事|職場|会社/.test(text)) topics.push('仕事');
  if (/家族|親|子/.test(text)) topics.push('家族');
  if (/健康|体調|病気/.test(text)) topics.push('健康');
  if (/趣味|読書|映画|音楽/.test(text)) topics.push('趣味');
  if (/食事|料理|レストラン/.test(text)) topics.push('食事');
  if (/旅行|出張|移動/.test(text)) topics.push('旅行');
  if (topics.length === 0) topics.push('日常');
  return topics;
}
