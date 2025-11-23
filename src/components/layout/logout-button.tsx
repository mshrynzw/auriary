'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { logoutAction } from '@/app/actions/auth';
import { LogOut } from 'lucide-react';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';

export function LogoutButton() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      const result = await logoutAction();
      if (result?.success && result.redirectTo) {
        router.push(result.redirectTo);
      } else if (result?.error) {
        console.error('Logout error:', result.error);
        // エラーが発生してもログアウト処理は続行
        router.push('/login');
      } else {
        router.push('/login');
      }
    } catch (error) {
      console.error('Logout error:', error);
      router.push('/login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DropdownMenuItem asChild>
      <button
        type="button"
        onClick={handleLogout}
        disabled={isLoading}
        className="w-full text-left"
      >
        <LogOut className="mr-2 h-4 w-4" />
        {isLoading ? 'ログアウト中...' : 'ログアウト'}
      </button>
    </DropdownMenuItem>
  );
}

