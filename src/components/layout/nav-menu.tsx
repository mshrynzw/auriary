'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ChartArea, BookOpen, Calendar, BarChart3, Wallet } from 'lucide-react';

export function NavMenu() {
  const pathname = usePathname();

  return (
    <nav className="hidden md:flex items-center gap-4">
      <Link
        href="/dashboard"
        className={cn(
          buttonVariants({ variant: 'ghost', size: 'sm' }),
          pathname === '/dashboard' ? 'animate-dimlight' : 'cursor-pointer',
        )}
      >
        <ChartArea className="mr-2 h-4 w-4" />
        ダッシュボード
      </Link>
      <Link
        href="/diary"
        className={cn(
          buttonVariants({ variant: 'ghost', size: 'sm' }),
          pathname === '/diary' ? 'animate-dimlight' : 'cursor-pointer',
        )}
      >
        <BookOpen className="mr-2 h-4 w-4" />
        日記
      </Link>
      <Link
        href="/calendar"
        className={cn(
          buttonVariants({ variant: 'ghost', size: 'sm' }),
          pathname === '/calendar' ? 'animate-dimlight' : 'cursor-pointer',
        )}
      >
        <Calendar className="mr-2 h-4 w-4" />
        カレンダー
      </Link>
      <Link
        href="/analytics"
        className={cn(
          buttonVariants({ variant: 'ghost', size: 'sm' }),
          pathname === '/analytics' ? 'animate-dimlight' : 'cursor-pointer',
        )}
      >
        <BarChart3 className="mr-2 h-4 w-4" />
        分析
      </Link>
      <Link
        href="/income-expense"
        className={cn(
          buttonVariants({ variant: 'ghost', size: 'sm' }),
          pathname === '/income-expense' ? 'animate-dimlight' : 'cursor-pointer',
        )}
      >
        <Wallet className="mr-2 h-4 w-4" />
        収支
      </Link>
    </nav>
  );
}
