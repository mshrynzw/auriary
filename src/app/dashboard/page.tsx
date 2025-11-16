import { requireAuth } from '@/lib/auth';
import { getDiariesAction } from '@/app/actions/diary';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Calendar, BarChart3, Plus, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { type DiaryRow } from '@/schemas';
import { UnifiedChart } from './charts';

export default async function DashboardPage() {
  const { userProfile } = await requireAuth();

  // 全期間の日記を取得（統計用）
  const allDiariesResult = await getDiariesAction();
  const allDiaries = allDiariesResult.diaries || [];

  // 今月の日記を取得
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const thisMonthResult = await getDiariesAction({
    start_date: format(firstDayOfMonth, 'yyyy-MM-dd'),
    end_date: format(lastDayOfMonth, 'yyyy-MM-dd'),
  });
  const thisMonthDiaries = thisMonthResult.diaries || [];

  // 最近の日記（5件）
  const recentDiaries = allDiaries.slice(0, 5);

  // 統計情報の計算
  const totalDiaries = allDiaries.length;
  const thisMonthCount = thisMonthDiaries.length;

  const diariesWithMood = allDiaries.filter((d) => d.mood !== null);
  const avgMood =
    diariesWithMood.length > 0
      ? diariesWithMood.reduce((sum, d) => sum + (d.mood || 0), 0) / diariesWithMood.length
      : null;

  const diariesWithSleepQuality = allDiaries.filter((d) => d.sleep_quality !== null);
  const avgSleepQuality =
    diariesWithSleepQuality.length > 0
      ? diariesWithSleepQuality.reduce((sum, d) => sum + (d.sleep_quality || 0), 0) /
        diariesWithSleepQuality.length
      : null;

  return (
    <div className="min-h-screen ">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-white/90">ダッシュボード</h1>
        </div>

        {/* 統計情報カード */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">総日記数</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalDiaries}</div>
              <p className="text-xs text-muted-foreground">件</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">今月の日記数</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{thisMonthCount}</div>
              <p className="text-xs text-muted-foreground">件</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">平均感情スコア</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgMood ? avgMood.toFixed(1) : '-'}</div>
              <p className="text-xs text-muted-foreground">{avgMood ? '/ 10' : 'データなし'}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">平均睡眠の質</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {avgSleepQuality ? avgSleepQuality.toFixed(1) : '-'}
              </div>
              <p className="text-xs text-muted-foreground">
                {avgSleepQuality ? '/ 5' : 'データなし'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 統合グラフ */}
        <div className="mb-8">
          <UnifiedChart diaries={allDiaries} />
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* 最近の日記 */}
          <Card className="md:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>最近の日記</CardTitle>
                <Link href="/diary">
                  <Button variant="ghost" size="sm">
                    すべて見る
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {recentDiaries.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">まだ日記がありません</p>
                  <Link href="/diary/new">
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      最初の日記を作成
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentDiaries.map((diary) => (
                    <Link
                      key={diary.id}
                      href={`/diary/${diary.id}`}
                      className="block p-4 border rounded-lg hover:bg-accent transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold mb-1">
                            {format(new Date(diary.journal_date), 'yyyy年M月d日 (E)', {
                              locale: ja,
                            })}
                          </h3>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {diary.note || '本文なし'}
                          </p>
                        </div>
                        {diary.mood && (
                          <div className="ml-4 text-sm font-medium">感情: {diary.mood}/10</div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* クイックアクション */}
          <Card>
            <CardHeader>
              <CardTitle>クイックアクション</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/diary/new" className="block">
                <Button className="w-full justify-start" size="lg">
                  <Plus className="mr-2 h-4 w-4" />
                  新しい日記を作成
                </Button>
              </Link>
              <Link href="/diary" className="block">
                <Button className="w-full justify-start" variant="outline" size="lg">
                  <BookOpen className="mr-2 h-4 w-4" />
                  日記一覧
                </Button>
              </Link>
              <Link href="/calendar" className="block">
                <Button className="w-full justify-start" variant="outline" size="lg">
                  <Calendar className="mr-2 h-4 w-4" />
                  カレンダー
                </Button>
              </Link>
              <Link href="/analytics" className="block">
                <Button className="w-full justify-start" variant="outline" size="lg">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  分析
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
