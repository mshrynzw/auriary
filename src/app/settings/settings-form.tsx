'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

type UserProfile = {
  id: number;
  display_name: string;
  email: string | null;
};

type SettingsFormProps = {
  userProfile: UserProfile | null;
};

export function SettingsForm({ userProfile }: SettingsFormProps) {
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    toast.info('設定の保存機能は将来実装予定です');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>プロフィール設定</CardTitle>
          <CardDescription>アカウント情報を編集</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="display_name">表示名</Label>
              <Input
                id="display_name"
                defaultValue={userProfile?.display_name || ''}
                disabled
              />
              <p className="text-xs text-muted-foreground">
                表示名の編集機能は将来実装予定です
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">メールアドレス</Label>
              <Input
                id="email"
                type="email"
                defaultValue={userProfile?.email || ''}
                disabled
              />
              <p className="text-xs text-muted-foreground">
                メールアドレスの変更機能は将来実装予定です
              </p>
            </div>
            <Button type="submit" disabled>
              保存（将来実装）
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>通知設定</CardTitle>
          <CardDescription>プッシュ通知・メール通知の設定</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            通知設定機能は将来実装予定です
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>AI設定</CardTitle>
          <CardDescription>AI補完レベルなどの設定</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            AI設定機能は将来実装予定です
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

