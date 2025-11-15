import { getAuth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { LoginForm } from './login-form';

export default async function LoginPage() {
  const { user } = await getAuth();

  // 既にログインしている場合はリダイレクト
  if (user) {
    redirect('/diary');
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <LoginForm />
      </div>
    </div>
  );
}

