import { getAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { LogIn, UserPlus, BookOpen } from 'lucide-react';

export default async function HomePage() {
  const authResult = await getAuth();
  const { user, userProfile } = authResult;

  // 環境変数が設定されていない場合のエラーメッセージ
  if (!authResult.supabase) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-destructive">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-destructive">設定エラー</CardTitle>
            <CardDescription>
              Supabaseの環境変数が正しく設定されていません。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Cloudflare Pagesの設定で、以下の環境変数が設定されているか確認してください：
            </p>
            <ul className="mt-4 space-y-2 text-sm">
              <li>• NEXT_PUBLIC_SUPABASE_URL</li>
              <li>• NEXT_PUBLIC_SUPABASE_ANON_KEY</li>
            </ul>
          </CardContent>
        </Card>
      </main>
    );
  }

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
              <Link href="/diary" className="block">
                <Button className="w-full" size="lg">
                  <BookOpen className="mr-2 h-4 w-4" />
                  日記を始める
                </Button>
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
          <CardDescription>
            AI と連携して日々の記録を楽に・美しく残せる次世代の日記アプリ
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Link href="/login" className="block">
              <Button className="w-full" size="lg">
                <LogIn className="mr-2 h-4 w-4" />
                ログイン
              </Button>
            </Link>
            <Link href="/register" className="block">
              <Button className="w-full" variant="outline" size="lg">
                <UserPlus className="mr-2 h-4 w-4" />
                新規登録
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
