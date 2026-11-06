import { getAuth } from '@/lib/auth';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { LogIn, UserPlus, BookOpen } from 'lucide-react';

export default async function HomePage() {
  const { user, userProfile } = await getAuth();

  if (user) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">auriary へようこそ</CardTitle>
            <CardDescription>
              {userProfile?.display_name || user.email} さん、おかえりなさい
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Link
                href="/diary/new"
                className={cn(buttonVariants({ size: 'lg' }), 'w-full')}
              >
                <BookOpen className="mr-2 h-4 w-4" />
                日記を始める
              </Link>
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">auriary</CardTitle>
          <CardDescription>日々の記録を楽に・幻想的に残せる次世代の日記アプリ</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Link href="/login" className={cn(buttonVariants({ size: 'lg' }), 'w-full')}>
              <LogIn className="mr-2 h-4 w-4" />
              ログイン
            </Link>
            <Link
              href="/register"
              className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'w-full')}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              新規登録
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
