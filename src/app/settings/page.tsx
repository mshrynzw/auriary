import { requireAuth } from '@/lib/auth';
import { SettingsForm } from './settings-form';
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

export default async function SettingsPage() {
  const { userProfile } = await requireAuth();

  return (
    <div className="aurialy ">
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-white/90">設定</h1>
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
                      <DialogTitle>設定画面について</DialogTitle>
                      <DialogDescription>
                        設定画面では、ユーザー設定・アカウント管理を行えます。
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2">
                      <h4 className="font-semibold">主な機能:</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        <li>プロフィール編集</li>
                        <li>通知設定（将来実装）</li>
                        <li>AI設定（将来実装）</li>
                        <li>アカウント削除</li>
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

        <SettingsForm userProfile={userProfile} />
      </div>
    </div>
  );
}
