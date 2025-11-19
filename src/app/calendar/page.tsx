import { requireAuth } from '@/lib/auth';
import { getDiariesAction } from '@/app/actions/diary';
import { CalendarView } from './calendar-view';
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
                      <DialogTitle>カレンダー画面について</DialogTitle>
                      <DialogDescription>
                        カレンダー画面では、日記をカレンダー形式で確認できます。月・週・日の3つのビューから選択できます。
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2">
                      <h4 className="font-semibold">主な機能:</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        <li>月・週・日ビューの切替</li>
                        <li>日記がある日付のハイライト</li>
                        <li>日付をクリックして日記を表示</li>
                        <li>期間フィルタリング</li>
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

        <CalendarView diaries={diaries} />
      </div>
    </div>
  );
}
