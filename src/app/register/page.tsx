import { getAuth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { RegisterForm } from './register-form';

export default async function RegisterPage() {
  const { user } = await getAuth();

  // 既にログインしている場合はリダイレクト
  if (user) {
    redirect('/diary');
  }

  return (
    <div className="min-h-screen flex items-center justify-center  p-4">
      <div className="w-full max-w-md">
        <RegisterForm />
      </div>
    </div>
  );
}
