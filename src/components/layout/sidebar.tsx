'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { BookOpen, Calendar, BarChart3, ChartArea, Settings, LogOut, Menu } from 'lucide-react';
import Link from 'next/link';
import { logoutAction } from '@/app/actions/auth';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

type SidberProps = {
  displayName: string;
  userEmail: string;
  initials: string;
};

export function Sidber({ displayName, userEmail, initials }: SidberProps) {
  const [open, setOpen] = useState(false);

  const menuItems = [
    { href: '/dashboard', icon: ChartArea, label: 'ダッシュボード' },
    { href: '/diary', icon: BookOpen, label: '日記' },
    { href: '/calendar', icon: Calendar, label: 'カレンダー' },
    { href: '/analytics', icon: BarChart3, label: '分析' },
    { href: '/settings', icon: Settings, label: '設定' },
  ];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">メニューを開く</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] sm:w-[400px] shadow-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <BookOpen className="h-6 w-6" />
            <span className="text-xl font-bold">auriary</span>
          </SheetTitle>
        </SheetHeader>
        <div className="mt-8 flex flex-col gap-4">
          {/* ユーザー情報 */}
          <div className="flex items-center gap-3 pb-4 border-b">
            <Avatar className="shrink-0">
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0 flex-1 overflow-hidden">
              <p className="text-sm font-medium truncate">{displayName}</p>
              <p
                className="text-xs text-muted-foreground wrap-break-word"
                style={{ overflowWrap: 'anywhere' }}
              >
                {userEmail}
              </p>
            </div>
          </div>

          {/* メニュー項目 */}
          <nav className="flex flex-col gap-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* ログアウト */}
          <div className="pt-4 border-t">
            <form action={logoutAction}>
              <button
                type="submit"
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
              >
                <LogOut className="h-5 w-5" />
                ログアウト
              </button>
            </form>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
