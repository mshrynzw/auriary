'use client';

import { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState<boolean | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    // 初期状態を設定
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // マウント前またはオンライン時は何も表示しない
  if (!isMounted || isOnline === null || isOnline) return null;

  return (
    <div
      className={cn(
        'fixed top-0 left-0 right-0 z-50 bg-yellow-500 dark:bg-yellow-600 text-yellow-900 dark:text-yellow-100',
        'px-4 py-2 text-center text-sm font-medium',
        'flex items-center justify-center gap-2',
      )}
    >
      <WifiOff className="h-4 w-4" />
      <span>オフラインです。一部の機能が制限されます。</span>
    </div>
  );
}
