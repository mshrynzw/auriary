import { getAuth } from '@/lib/auth';
import { getDiaryAction } from '@/app/actions/diary';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pencil, Calendar, Info } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { SentimentText } from '@/components/diary/sentiment-text';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function DiaryDetailPage({ params }: PageProps) {
  const { userProfile } = await getAuth();
  const { id } = await params;
  const diaryId = parseInt(id, 10);

  if (isNaN(diaryId)) {
    notFound();
  }

  const result = await getDiaryAction(diaryId);
  if (result?.error || !result?.diary) {
    notFound();
  }

  const diary = result.diary;
  const isAuthenticated = !!userProfile;

  return (
    <div className="aurialy ">
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-white/90">日記詳細</h1>
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Info className="h-5 w-5" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>日記詳細画面について</DialogTitle>
                        <DialogDescription>
                          日記詳細画面では、個別の日記を表示します。編集・削除機能も利用できます。
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-2">
                        <h4 className="font-semibold">主な機能:</h4>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                          <li>日記本文の表示</li>
                          <li>感情スコア（AI分析）・各種スコアの表示</li>
                          <li>日記の編集・削除</li>
                        </ul>
                      </div>
                    </DialogContent>
                  </Dialog>
                </TooltipTrigger>
                <TooltipContent>
                  <p>画面の説明を表示</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {isAuthenticated && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link href={`/diary/${diaryId}/edit`}>
                      <Button>
                        <Pencil className="mr-2 h-4 w-4" />
                        編集
                      </Button>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>日記を編集</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="text-2xl">
                  {format(new Date(diary.journal_date), 'yyyy年M月d日 (E)', { locale: ja })}
                </CardTitle>
                <CardDescription className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(diary.journal_date), 'yyyy-MM-dd')}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {diary.mood && (
                  <Badge variant="outline">感情スコア（AI分析）: {diary.mood}/10</Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {diary.note && (
              <div className="space-y-2">
                <h3 className="font-semibold">日記本文</h3>
                <div className="prose prose-sm max-w-none">
                  <SentimentText
                    text={diary.note}
                    highlightedWords={diary.sentiment_analysis_result?.highlighted_words || []}
                  />
                </div>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              {diary.sleep_quality && (
                <div className="space-y-1">
                  <p className="text-sm font-medium">睡眠の質</p>
                  <p className="text-2xl font-bold">{diary.sleep_quality}/5</p>
                </div>
              )}
              {diary.wake_level && (
                <div className="space-y-1">
                  <p className="text-sm font-medium">起床時の気分</p>
                  <p className="text-2xl font-bold">{diary.wake_level}/5</p>
                </div>
              )}
              {diary.daytime_level && (
                <div className="space-y-1">
                  <p className="text-sm font-medium">日中の気分</p>
                  <p className="text-2xl font-bold">{diary.daytime_level}/5</p>
                </div>
              )}
              {diary.pre_sleep_level && (
                <div className="space-y-1">
                  <p className="text-sm font-medium">就寝前の気分</p>
                  <p className="text-2xl font-bold">{diary.pre_sleep_level}/5</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-4 pt-4 border-t">
              <Link href="/diary">
                <Button variant="outline">一覧に戻る</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
