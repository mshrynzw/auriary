'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerFormSchema, type RegisterFormInput } from '@/schemas';
import { registerAction } from '@/app/actions/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import Link from 'next/link';

export function RegisterForm() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormInput>({
    resolver: zodResolver(registerFormSchema),
  });

  const onSubmit = async (data: RegisterFormInput) => {
    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('email', data.email);
    formData.append('password', data.password);
    formData.append('display_name', data.display_name);

    const result = await registerAction(formData);

    if (result?.error) {
      setError(result.error.message);
      setIsLoading(false);
    }
    // 成功時は registerAction 内でリダイレクトされる
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-bold">新規登録</CardTitle>
        <CardDescription>auriary のアカウントを作成して、日記を始めましょう</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="display_name">表示名</Label>
            <Input
              id="display_name"
              type="text"
              placeholder="山田 太郎"
              {...register('display_name')}
              disabled={isLoading}
            />
            {errors.display_name && (
              <p className="text-sm text-destructive">{errors.display_name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">メールアドレス</Label>
            <Input
              id="email"
              type="email"
              placeholder="example@email.com"
              {...register('email')}
              disabled={isLoading}
            />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">パスワード</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              {...register('password')}
              disabled={isLoading}
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              パスワードは6文字以上である必要があります
            </p>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? '登録中...' : '新規登録'}
          </Button>

          <div className="text-center text-sm">
            <span className="text-muted-foreground">既にアカウントをお持ちの方は</span>{' '}
            <Link href="/login" className="text-primary hover:underline">
              ログイン
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
