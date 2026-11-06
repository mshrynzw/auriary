import { getAuth } from '@/lib/auth';
import { getDiaryAction } from '@/app/actions/diary';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pencil, Calendar } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { SentimentText } from '@/components/diary/sentiment-text';
import { ScreenHelpButton } from '@/components/layout/screen-help-button';

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
            <ScreenHelpButton
              title="日記詳細画面について"
              description="日記詳細画面では、個別の日記を表示します。編集・削除機能も利用できます。"
              items={['日記本文の表示', '感情スコア（AI分析）・各種スコアの表示', '日記の編集・削除']}
            />
            {isAuthenticated && (
              <Link href={`/diary/${diaryId}/edit`} className={buttonVariants()}>
                <Pencil className="mr-2 h-4 w-4" />
                編集
              </Link>
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
              {diary.sleep_quality != null && (
                <div className="space-y-1">
                  <p className="text-sm font-medium">睡眠の質</p>
                  <p className="text-2xl font-bold">{diary.sleep_quality}/10</p>
                </div>
              )}
              {diary.bipolar_self_level != null && (
                <div className="space-y-1">
                  <p className="text-sm font-medium">躁鬱（自己判定）</p>
                  <p className="text-2xl font-bold">{diary.bipolar_self_level}/10</p>
                </div>
              )}
              {diary.wake_level != null && (
                <div className="space-y-1">
                  <p className="text-sm font-medium">起床時の気分</p>
                  <p className="text-2xl font-bold">{diary.wake_level}/10</p>
                </div>
              )}
              {diary.daytime_level != null && (
                <div className="space-y-1">
                  <p className="text-sm font-medium">日中の気分</p>
                  <p className="text-2xl font-bold">{diary.daytime_level}/10</p>
                </div>
              )}
              {diary.pre_sleep_level != null && (
                <div className="space-y-1">
                  <p className="text-sm font-medium">就寝前の気分</p>
                  <p className="text-2xl font-bold">{diary.pre_sleep_level}/10</p>
                </div>
              )}
              {diary.systolic != null && (
                <div className="space-y-1">
                  <p className="text-sm font-medium">収縮期血圧</p>
                  <p className="text-2xl font-bold">{diary.systolic} mmHg</p>
                </div>
              )}
              {diary.diastolic != null && (
                <div className="space-y-1">
                  <p className="text-sm font-medium">拡張期血圧</p>
                  <p className="text-2xl font-bold">{diary.diastolic} mmHg</p>
                </div>
              )}
              {diary.pulse != null && (
                <div className="space-y-1">
                  <p className="text-sm font-medium">脈拍</p>
                  <p className="text-2xl font-bold">{diary.pulse} bpm</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-4 pt-4 border-t">
              <Link href="/diary" className={buttonVariants({ variant: 'outline' })}>
                一覧に戻る
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
