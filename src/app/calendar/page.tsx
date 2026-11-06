import { requireAuth } from '@/lib/auth';
import { getDiariesAction } from '@/app/actions/diary';
import { CalendarView } from './calendar-view';
import { ScreenHelpButton } from '@/components/layout/screen-help-button';

export default async function CalendarPage() {
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
            title="カレンダー画面について"
            description="カレンダー画面では、日記をカレンダー形式で確認できます。月・週・日の3つのビューから選択できます。"
            items={[
              '月・週・日ビューの切替',
              '日記がある日付のハイライト',
              '日付をクリックして日記を表示',
              '期間フィルタリング',
            ]}
          />
        </div>

        <CalendarView diaries={diaries} />
      </div>
    </div>
  );
}
