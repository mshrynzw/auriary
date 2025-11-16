'use client';

import { useEffect } from 'react';

export default function PwaScript() {
  useEffect(() => {
    // Service Worker の登録
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      const registerServiceWorker = async () => {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/',
          });

          console.log('Service Worker registered:', registration.scope);

          // 更新チェック
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // 新しいService Workerが利用可能
                  console.log('New Service Worker available');
                  // 必要に応じて更新通知を表示
                }
              });
            }
          });

          // コントローラーの変更を監視
          navigator.serviceWorker.addEventListener('controllerchange', () => {
            console.log('Service Worker controller changed');
            // ページをリロードして新しいService Workerを有効化
            window.location.reload();
          });
        } catch (error) {
          console.error('Service Worker registration failed:', error);
        }
      };

      registerServiceWorker();
    }
  }, []);

  return null;
}

