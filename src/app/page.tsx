import { createSupabaseServerClient } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default async function HomePage() {
  const supabase = createSupabaseServerClient();

  const { data: { user } = {} } = await supabase.auth.getUser();

  return (
    <main className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">
            Next.js 16 + Cloudflare + Supabase + Tailwind v4 + shadcn/ui
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {user ? `ログインユーザー: ${user.email}` : 'まだログインしていません。'}
          </p>
          <Button size="lg">shadcn/ui の Button です</Button>
        </CardContent>
      </Card>
    </main>
  );
}
