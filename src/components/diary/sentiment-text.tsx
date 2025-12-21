'use client';

import { type HighlightedWord } from '@/lib/ai/sentiment-api';
import { cn } from '@/lib/utils';

interface SentimentTextProps {
  text: string;
  highlightedWords?: HighlightedWord[]; // propsで受け取る（データベースから取得）
  className?: string;
}

export function SentimentText({ text, highlightedWords = [], className }: SentimentTextProps) {
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
                  'relative inline-block font-bold animate-dimlight box-reflect aurialy-logo',
                  part.highlight.sentiment === 'positive'
                    ? 'animate-sentiment-glow-positive'
                    : 'animate-sentiment-glow-negative',
                )}
                style={{
                  WebkitBoxReflect: 'below 0px linear-gradient(transparent, rgba(0,0,0,0.1))',
                }}
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
    <div className={cn('whitespace-pre-wrap break-words', className)}>
      {renderHighlightedText()}
    </div>
  );
}
