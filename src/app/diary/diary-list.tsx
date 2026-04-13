'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { DiaryPreviewDialog } from './diary-preview-dialog';
import { DiaryEditDeleteButtons } from '@/components/diary/diary-edit-delete-buttons';
import { type DiaryRow } from '@/schemas';
import { SentimentText } from '@/components/diary/sentiment-text';

type DiaryListProps = {
  diaries: DiaryRow[];
  isAuthenticated?: boolean;
};

export function DiaryList({ diaries, isAuthenticated = false }: DiaryListProps) {
  const [previewDiary, setPreviewDiary] = useState<DiaryRow | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const handlePreview = (diary: DiaryRow) => {
    setPreviewDiary(diary);
    setIsPreviewOpen(true);
  };
  if (diaries.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">まだ日記がありません</p>
          <Link href="/diary/new" className="mt-4 inline-block">
            <Button>最初の日記を作成</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {diaries.map((diary) => (
          <Card
            key={diary.id}
            className="border-none bg-muted/50 hover:bg-muted/70 transition-colors cursor-pointer"
            onClick={() => handlePreview(diary)}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">
                    {format(new Date(diary.journal_date), 'yyyy年M月d日 (E)', { locale: ja })}
                  </CardTitle>
                  {/* <CardDescription className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(diary.journal_date), 'yyyy-MM-dd')}
                  </CardDescription> */}
                </div>
                <div className="flex items-center gap-1">
                  {diary.mood && (
                    <Badge variant="outline">感情スコア（AI分析）: {diary.mood}/10</Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-sm line-clamp-3 mb-4">
                {diary.note ? (
                  <SentimentText
                    text={diary.note}
                    highlightedWords={diary.sentiment_analysis_result?.highlighted_words || []}
                  />
                ) : (
                  <span className="text-muted-foreground">本文なし</span>
                )}
              </div>
              <DiaryEditDeleteButtons diaryId={diary.id} isAuthenticated={isAuthenticated} />
            </CardContent>
          </Card>
        ))}
      </div>
      <DiaryPreviewDialog
        diary={previewDiary}
        open={isPreviewOpen}
        onOpenChange={setIsPreviewOpen}
      />
    </>
  );
}
