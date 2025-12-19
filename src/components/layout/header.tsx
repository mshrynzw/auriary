import { getAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { BookOpen, Settings } from 'lucide-react';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogoutButton } from './logout-button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Info, Plus } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Sidber } from './sidebar';
import { NavMenu } from './nav-menu';

export async function Header() {
  try {
    const { user, userProfile } = await getAuth();

    const displayName = userProfile?.display_name || user?.email?.split('@')[0] || 'ユーザー';
    const initials = displayName
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    return (
      <header className="fixed top-0 left-0 right-0 z-50 border-b bg-background/60 backdrop-blur-s">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <div
                className="flex items-center gap-2 text-2xl font-semibold tracking-wider animate-dimlight box-reflect group-data-[collapsible=icon]:hidden aurialy-logo"
                data-text="auriary"
              >
                <span className="inline-block">
                  <BookOpen className="h-8 w-8" />
                </span>
                auriary
              </div>
            </Link>
            {user && <NavMenu />}
          </div>
          {user && (
            <div className="flex items-center gap-4">
              {/* モバイル用メニュー */}
              <Sidber displayName={displayName} userEmail={user.email || ''} initials={initials} />
              <div className="flex items-center gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="bg-white/15 hover:bg-white/25 shadow-lg hover:shodow-2xl cursor-pointer"
                          >
                            <Info className="h-6 w-6 text-white hover:text-slate-700 transition-colors" />
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
                        <Button className="shadow-lg hover:shodow-2xl cursor-pointer">
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
              {/* デスクトップ用アバターメニュー */}
              <div className="hidden md:block">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="relative h-10 w-10 rounded-full cursor-pointer"
                    >
                      <Avatar>
                        <AvatarFallback>{initials}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{displayName}</p>
                        <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <Link href="/settings">
                      <DropdownMenuItem className="cursor-pointer">
                        <Settings className="mr-2 h-4 w-4" />
                        設定
                      </DropdownMenuItem>
                    </Link>
                    <DropdownMenuSeparator />
                    <LogoutButton />
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          )}
        </div>
      </header>
    );
  } catch (error) {
    console.error('Header error:', error);
    // エラー時も最低限のヘッダーを表示
    return (
      <header className="fixed top-0 left-0 right-0 z-40 border-b bg-background/60 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="flex items-center gap-2">
              <BookOpen className="h-6 w-6" />
              <span className="text-xl font-bold">auriary</span>
            </Link>
          </div>
        </div>
      </header>
    );
  }
}
