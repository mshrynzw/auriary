'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChartArea, BookOpen, Calendar, BarChart3 } from 'lucide-react';

export function NavMenu() {
  const pathname = usePathname();

  return (
    <nav className="hidden md:flex items-center gap-4">
      <Link href="/dashboard">
        <Button
          variant="ghost"
          size="sm"
          className={pathname === '/dashboard' || pathname === '/' ? 'animate-dimlight' : ''}
        >
          <ChartArea className="mr-2 h-4 w-4" />
          ダッシュボード
        </Button>
      </Link>
      <Link href="/diary">
        <Button
          variant="ghost"
          size="sm"
          className={
            pathname.startsWith('/diary') && pathname !== '/diary/new' ? 'animate-dimlight' : ''
          }
        >
          <BookOpen className="mr-2 h-4 w-4" />
          日記
        </Button>
      </Link>
      <Link href="/calendar">
        <Button
          variant="ghost"
          size="sm"
          className={pathname === '/calendar' ? 'animate-dimlight' : ''}
        >
          <Calendar className="mr-2 h-4 w-4" />
          カレンダー
        </Button>
      </Link>
      <Link href="/analytics">
        <Button
          variant="ghost"
          size="sm"
          className={pathname === '/analytics' ? 'animate-dimlight' : ''}
        >
          <BarChart3 className="mr-2 h-4 w-4" />
          分析
        </Button>
      </Link>
    </nav>
  );
}

