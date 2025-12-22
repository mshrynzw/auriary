// Service Worker for auriary PWA
const CACHE_NAME = 'auriary-v1';
const STATIC_CACHE = 'auriary-static-v1';
const API_CACHE = 'auriary-api-v1';

// インストール時に静的アセットをキャッシュ
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(['/', '/manifest.json', '/icon-192x192.png', '/icon-512x512.png']);
    }),
  );
  self.skipWaiting();
});

// アクティベート時に古いキャッシュを削除
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => {
            return name !== CACHE_NAME && name !== STATIC_CACHE && name !== API_CACHE;
          })
          .map((name) => {
            console.log('Service Worker: Deleting old cache', name);
            return caches.delete(name);
          }),
      );
    }),
  );
  self.clients.claim();
});

// フェッチ時にキャッシュを確認
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 同じオリジンのリクエストのみ処理
  if (url.origin !== location.origin) {
    return;
  }

  // Next.jsの動的コンテンツはService Workerで処理しない
  // - HTMLページ: 認証状態が変わる可能性があるため、常に最新の状態を取得
  // - Next.jsのデータフェッチ（/_next/data/）: 動的なデータが含まれるため
  // - 認証関連ページ: セキュリティのため常にネットワークから取得
  // Next.jsのServer ComponentsとMiddlewareの機能を最大限活用
  if (
    // HTMLページ
    (request.method === 'GET' && request.headers.get('accept')?.includes('text/html')) ||
    // Next.jsのデータフェッチ
    url.pathname.startsWith('/_next/data/') ||
    // 認証関連ページ
    url.pathname.startsWith('/login') ||
    url.pathname.startsWith('/register') ||
    url.pathname.startsWith('/logout')
  ) {
    // Service Workerで処理せず、通常のネットワークリクエストを実行
    return;
  }

  // 静的アセットは Cache First
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/_next/image') ||
    url.pathname.match(/\.(jpg|jpeg|png|gif|svg|ico|woff|woff2|ttf|eot)$/)
  ) {
    event.respondWith(
      caches.match(request).then((response) => {
        return (
          response ||
          fetch(request).then((fetchResponse) => {
            // キャッシュに保存
            if (fetchResponse.ok) {
              const clone = fetchResponse.clone();
              caches.open(STATIC_CACHE).then((cache) => {
                cache.put(request, clone);
              });
            }
            return fetchResponse;
          })
        );
      }),
    );
    return;
  }

  // API リクエストは Network First
  // 認証が必要なAPIは常に最新の状態を取得
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // 成功したレスポンスをキャッシュに保存（オフライン対応のため）
          if (response.ok) {
            const clone = response.clone();
            caches.open(API_CACHE).then((cache) => {
              cache.put(request, clone);
            });
          }
          return response;
        })
        .catch(() => {
          // ネットワークエラー時はキャッシュから取得（オフライン対応）
          return caches.match(request).then((response) => {
            if (response) {
              return response;
            }
            // キャッシュにもない場合はエラーレスポンス
            return new Response(JSON.stringify({ error: 'オフラインです' }), {
              status: 503,
              headers: { 'Content-Type': 'application/json' },
            });
          });
        }),
    );
    return;
  }

  // その他のリクエストは通常のフェッチ
  event.respondWith(fetch(request));
});

// プッシュ通知（将来実装）
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push received');
  // 将来実装
});

// 通知クリック（将来実装）
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked');
  event.notification.close();
  // 将来実装
});
