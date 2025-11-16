import { getAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { LogOut, BookOpen, Calendar, BarChart3, Settings, ChartArea } from 'lucide-react';
import Link from 'next/link';
import { logoutAction } from '@/app/actions/auth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Sidber } from './sidebar';

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
            <Link href="/dashboard" className="flex items-center gap-2">
              <BookOpen className="h-8 w-8" />
              <span
                className="text-2xl font-semibold tracking-wider animate-dimlight box-reflect group-data-[collapsible=icon]:hidden aurawork-logo"
                data-text="aurawork"
              >
                aurawork
              </span>
            </Link>
            {user && (
              <nav className="hidden md:flex items-center gap-4">
                <Link href="/dashboard">
                  <Button variant="ghost" size="sm">
                    <ChartArea className="mr-2 h-4 w-4" />
                    ダッシュボード
                  </Button>
                </Link>
                <Link href="/diary">
                  <Button variant="ghost" size="sm">
                    <BookOpen className="mr-2 h-4 w-4" />
                    日記
                  </Button>
                </Link>
                <Link href="/calendar">
                  <Button variant="ghost" size="sm">
                    <Calendar className="mr-2 h-4 w-4" />
                    カレンダー
                  </Button>
                </Link>
                <Link href="/analytics">
                  <Button variant="ghost" size="sm">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    分析
                  </Button>
                </Link>
              </nav>
            )}
          </div>
          {user && (
            <div className="flex items-center gap-4">
              {/* モバイル用メニュー */}
              <Sidber displayName={displayName} userEmail={user.email || ''} initials={initials} />
              {/* デスクトップ用アバターメニュー */}
              <div className="hidden md:block">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
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
                      <DropdownMenuItem>
                        <Settings className="mr-2 h-4 w-4" />
                        設定
                      </DropdownMenuItem>
                    </Link>
                    <DropdownMenuSeparator />
                    <form action={logoutAction}>
                      <DropdownMenuItem asChild>
                        <button type="submit" className="w-full text-left">
                          <LogOut className="mr-2 h-4 w-4" />
                          ログアウト
                        </button>
                      </DropdownMenuItem>
                    </form>
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
