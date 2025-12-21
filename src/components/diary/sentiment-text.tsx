'use client';

import { useEffect, useState } from 'react';
import { analyzeSentiment, type HighlightedWord } from '@/lib/ai/sentiment-api';
import { cn } from '@/lib/utils';

interface SentimentTextProps {
  text: string;
  diaryId?: number;
  className?: string;
}

export function SentimentText({ text, diaryId, className }: SentimentTextProps) {
  const [highlightedWords, setHighlightedWords] = useState<HighlightedWord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!text || text.trim().length === 0) {
      setHighlightedWords([]);
      return;
    }

    setIsLoading(true);
    setError(null);
    analyzeSentiment(text)
      .then((result) => {
        setHighlightedWords(result.highlighted_words);
      })
      .catch((err) => {
        console.error('Failed to analyze sentiment:', err);
        setError('感情分析に失敗しました');
        setHighlightedWords([]);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [text]);

  // テキストをハイライト付きで表示
  const renderHighlightedText = () => {
    if (highlightedWords.length === 0) {
      return <span>{text}</span>;
    }

    // 注目ワードの位置をマーク
    const wordPositions: Array<{
      start: number;
      end: number;
      word: HighlightedWord;
    }> = [];

    highlightedWords.forEach((wordObj) => {
      // 正規表現エスケープ
      const escapedWord = wordObj.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escapedWord, 'gi');
      let match;
      while ((match = regex.exec(text)) !== null) {
        wordPositions.push({
          start: match.index,
          end: match.index + match[0].length,
          word: wordObj,
        });
      }
    });

    // 位置でソート
    wordPositions.sort((a, b) => a.start - b.start);

    // 重複を除去（同じ位置の単語）
    const uniquePositions: typeof wordPositions = [];
    for (let i = 0; i < wordPositions.length; i++) {
      const current = wordPositions[i];
      const prev = uniquePositions[uniquePositions.length - 1];
      if (!prev || current.start >= prev.end) {
        uniquePositions.push(current);
      }
    }

    // テキストを分割してハイライト
    const parts: Array<{ text: string; highlight?: HighlightedWord }> = [];
    let lastIndex = 0;

    uniquePositions.forEach((pos) => {
      if (pos.start > lastIndex) {
        parts.push({ text: text.slice(lastIndex, pos.start) });
      }
      parts.push({
        text: text.slice(pos.start, pos.end),
        highlight: pos.word,
      });
      lastIndex = pos.end;
    });

    if (lastIndex < text.length) {
      parts.push({ text: text.slice(lastIndex) });
    }

    return (
      <>
        {parts.map((part, index) => {
          if (part.highlight) {
            return (
              <span
                key={index}
                className={cn(
                  'inline-block',
                  part.highlight.sentiment === 'positive' ? 'text-green-400' : 'text-red-400',
                  'animate-sparkle font-semibold',
                )}
              >
                {part.text}
              </span>
            );
          }
          return <span key={index}>{part.text}</span>;
        })}
      </>
    );
  };

  return (
    <div className={cn('whitespace-pre-wrap', className)}>
      {isLoading ? (
        <span className="text-muted-foreground text-sm">分析中...</span>
      ) : error ? (
        <span className="text-muted-foreground text-sm">{error}</span>
      ) : (
        renderHighlightedText()
      )}
    </div>
  );
}
