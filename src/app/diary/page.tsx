import { requireAuth } from '@/lib/auth';
import { getDiariesAction } from '@/app/actions/diary';
import { DiaryList } from './diary-list';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { Info } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default async function DiaryPage() {
  const { userProfile } = await requireAuth();
  const result = await getDiariesAction({ limit: 50 });

  const diaries = result.diaries || [];

  return (
    <div className="min-h-screen ">
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-white/90">日記一覧</h1>
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
                        <DialogTitle>日記一覧画面について</DialogTitle>
                        <DialogDescription>
                          日記一覧画面では、過去に作成した日記を一覧で確認できます。フィルターや検索機能を使って、目的の日記を素早く見つけることができます。
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-2">
                        <h4 className="font-semibold">主な機能:</h4>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                          <li>日記の一覧表示</li>
                          <li>日付・期間でのフィルタリング</li>
                          <li>日記の作成・編集・削除</li>
                          <li>日記の詳細表示</li>
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
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link href="/diary/new">
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      新規作成
                    </Button>
                  </Link>
                </TooltipTrigger>
                <TooltipContent>
                  <p>新しい日記を作成</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        <DiaryList diaries={diaries} />
      </div>
    </div>
  );
}
