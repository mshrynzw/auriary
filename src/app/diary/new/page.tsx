import { requireAuth } from '@/lib/auth';
import { DiaryEditor } from '../diary-editor';
import { getDailyDefaultsAction } from '@/app/actions/daily-defaults';
import { ScreenHelpButton } from '@/components/layout/screen-help-button';

export default async function NewDiaryPage() {
  await requireAuth();
  const defaultsResult = await getDailyDefaultsAction();
  const defaults = defaultsResult?.defaults;

  return (
    <div className="aurialy ">
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-white/90">新しい日記</h1>
          <ScreenHelpButton
            title="日記編集画面について"
            description="日記編集画面では、新しい日記を作成したり、既存の日記を編集できます。AI補完機能を使って、文章作成をサポートします。"
            items={[
              '日記本文の入力（Markdown対応）',
              '感情スコア（AI分析）の設定',
              '睡眠・入浴時間の記録',
              'AI補完機能（将来実装）',
            ]}
          />
        </div>

        <DiaryEditor defaults={defaults} />
      </div>
    </div>
  );
}
