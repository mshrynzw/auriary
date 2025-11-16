import { getAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { LogOut, User, BookOpen, Calendar, BarChart3, Settings } from 'lucide-react';
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

export async function Header() {
  try {
    const { user, userProfile } = await getAuth();

    if (!user) {
      return null;
    }

    const displayName = userProfile?.display_name || user.email?.split('@')[0] || 'ユーザー';
    const initials = displayName
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    return (
      <header className="border-b bg-background">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link href="/diary" className="flex items-center gap-2">
              <BookOpen className="h-6 w-6" />
              <span className="text-xl font-bold">auriary</span>
            </Link>
            <nav className="hidden md:flex items-center gap-4">
              <Link href="/diary">
                <Button variant="ghost" size="sm">
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
          </div>
          <div className="flex items-center gap-4">
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
      </header>
    );
  } catch (error) {
    console.error('Header error:', error);
    return null;
  }
}
