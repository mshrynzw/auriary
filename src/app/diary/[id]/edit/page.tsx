import { requireAuth } from '@/lib/auth';
import { getDiaryAction } from '@/app/actions/diary';
import { getDailyDefaultsAction } from '@/app/actions/daily-defaults';
import { DiaryEditor } from '../../diary-editor';
import { notFound } from 'next/navigation';
import { Info } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditDiaryPage({ params }: PageProps) {
  await requireAuth();
  const { id } = await params;
  const diaryId = parseInt(id, 10);

  if (isNaN(diaryId)) {
    notFound();
  }

  const result = await getDiaryAction(diaryId);
  if (result?.error || !result?.diary) {
    notFound();
  }

  // デフォルト設定を取得
  const defaultsResult = await getDailyDefaultsAction();
  const defaults = defaultsResult?.defaults;

  return (
    <div className="aurialy ">
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-white/90">日記を編集</h1>
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
                      <DialogTitle>日記編集画面について</DialogTitle>
                      <DialogDescription>
                        日記編集画面では、新しい日記を作成したり、既存の日記を編集できます。AI補完機能を使って、文章作成をサポートします。
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2">
                      <h4 className="font-semibold">主な機能:</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        <li>日記本文の入力（Markdown対応）</li>
                        <li>感情スコア（AI分析）の設定</li>
                        <li>睡眠・入浴時間の記録</li>
                        <li>AI補完機能（将来実装）</li>
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
        </div>

        <DiaryEditor diary={result.diary} defaults={defaults} />
      </div>
    </div>
  );
}
