import { requireAuth } from '@/lib/auth';
import { getDiariesAction } from '@/app/actions/diary';
import { AnalyticsView } from './analytics-view';
import { ScreenHelpButton } from '@/components/layout/screen-help-button';

export default async function AnalyticsPage() {
  await requireAuth();

  // 過去30日間の日記を取得
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);

  const result = await getDiariesAction({
    start_date: startDate.toISOString().split('T')[0],
    end_date: endDate.toISOString().split('T')[0],
  });

  const diaries = result.diaries || [];

  return (
    <div className="aurialy ">
      <div className="container mx-auto pb-8 px-4">
        <div className="flex items-center justify-between">
          <ScreenHelpButton
            title="分析画面について"
            description="分析画面では、感情スコア（AI分析）・トピック分析の可視化を確認できます。"
            items={[
              '過去30日間の感情スコア推移グラフ（AI分析）',
              'トピック分布（円グラフ）',
              '統計サマリー（カード表示）',
            ]}
          />
        </div>

        <AnalyticsView diaries={diaries} />
      </div>
    </div>
  );
}
