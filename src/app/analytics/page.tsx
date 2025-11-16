import { requireAuth } from '@/lib/auth';
import { getDiariesAction } from '@/app/actions/diary';
import { AnalyticsView } from './analytics-view';
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
    <div className="min-h-screen ">
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-white/90">分析</h1>
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
                      <DialogTitle>分析画面について</DialogTitle>
                      <DialogDescription>
                        分析画面では、感情分析・トピック分析の可視化を確認できます。
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2">
                      <h4 className="font-semibold">主な機能:</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        <li>過去30日間の感情推移グラフ</li>
                        <li>トピック分布（円グラフ）</li>
                        <li>統計サマリー（カード表示）</li>
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

        <AnalyticsView diaries={diaries} />
      </div>
    </div>
  );
}
