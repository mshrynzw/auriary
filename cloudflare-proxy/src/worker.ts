/**
 * Cloudflare Worker - Vercel オリジンへのリバースプロキシ（パターン2）
 *
 * アーキテクチャ概要:
 * - ユーザー → Cloudflare Worker（このファイル） → Vercel（https://auriary.vercel.app）
 * - SSR/ISR ロジックはすべて Vercel 側の Next.js に任せる
 * - Cloudflare 側は非ログイン時のページや静的アセットをキャッシュして高速化
 * - Supabase Auth の Cookie / Authorization ヘッダがあるリクエストはキャッシュをバイパス
 *
 * 想定フロー:
 * 1. リクエスト受信
 * 2. パーソナライズ判定（Cookie / Authorization ヘッダの有無）
 * 3. キャッシュ可能な場合 → Cloudflare エッジキャッシュを利用
 * 4. キャッシュ不可の場合 → オリジン（Vercel）へ直接プロキシ
 * 5. レスポンスを返す
 */

// Cloudflare Workers の型定義
interface CloudflareCacheOptions {
  cacheTtl?: number;
  cacheEverything?: boolean;
}

interface CloudflareRequestInit extends RequestInit {
  cf?: CloudflareCacheOptions;
}

interface Env {
  ORIGIN_BASE_URL: string;
}

/**
 * Supabase Auth 関連の Cookie 名パターンをチェック
 * @param cookieHeader Cookie ヘッダーの値
 * @returns パーソナライズされたリクエストかどうか
 */
function isPersonalizedRequest(request: Request): boolean {
  // Authorization ヘッダーがある場合はパーソナライズ
  if (request.headers.get('Authorization')) {
    return true;
  }

  // Cookie ヘッダーをチェック
  const cookieHeader = request.headers.get('Cookie');
  if (!cookieHeader) {
    return false;
  }

  // Supabase Auth 関連の Cookie パターンをチェック
  // @supabase/ssr は通常 `sb-<project-ref>-auth-token` という形式を使用
  // その他、一般的な認証関連の Cookie 名もチェック
  const supabaseCookiePatterns = [
    /sb-[^-]+-auth-token/i, // sb-<project-ref>-auth-token
    /sb-access-token/i,
    /sb-refresh-token/i,
    /supabase-auth-token/i,
  ];

  return supabaseCookiePatterns.some((pattern) => pattern.test(cookieHeader));
}

/**
 * 静的アセットかどうかを判定
 * @param pathname URL のパス名
 * @returns 静的アセットかどうか
 */
function isStaticAsset(pathname: string): boolean {
  const staticPaths = [
    '/_next/static/',
    '/favicon',
    '/icons/',
    '/images/',
    '/icon-',
    '/apple-icon-',
    '/manifest.json',
    '.svg',
    '.png',
    '.jpg',
    '.jpeg',
    '.gif',
    '.webp',
    '.ico',
    '.woff',
    '.woff2',
    '.ttf',
    '.eot',
  ];

  return staticPaths.some((path) => pathname.includes(path));
}

/**
 * API エンドポイントかどうかを判定
 * @param pathname URL のパス名
 * @returns API エンドポイントかどうか
 */
function isApiEndpoint(pathname: string): boolean {
  return pathname.startsWith('/api/') || pathname.startsWith('/supabase/');
}

/**
 * リクエストをオリジン（Vercel）へプロキシ
 * @param request 元のリクエスト
 * @param env 環境変数
 * @returns プロキシされたレスポンス
 */
async function proxyToOrigin(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const originUrl = `${env.ORIGIN_BASE_URL}${url.pathname}${url.search}`;

  // リクエストヘッダーをコピー（Host ヘッダーは除外）
  const headers = new Headers(request.headers);
  headers.delete('Host');
  headers.set('X-Forwarded-Host', url.host);
  headers.set('X-Forwarded-Proto', url.protocol.slice(0, -1)); // 'https:' → 'https'

  // キャッシュ戦略の決定
  const isPersonalized = isPersonalizedRequest(request);
  const isStatic = isStaticAsset(url.pathname);
  const isApi = isApiEndpoint(url.pathname);
  const isGet = request.method === 'GET';

  // キャッシュ設定
  const cacheOptions: CloudflareCacheOptions = {};

  if (!isGet) {
    // GET 以外はキャッシュしない
    cacheOptions.cacheTtl = 0;
    cacheOptions.cacheEverything = false;
  } else if (isPersonalized || isApi) {
    // パーソナライズされたリクエストや API はキャッシュしない
    cacheOptions.cacheTtl = 0;
    cacheOptions.cacheEverything = false;
  } else if (isStatic) {
    // 静的アセットは長期キャッシュ（1日 = 86400秒）
    cacheOptions.cacheTtl = 86400;
    cacheOptions.cacheEverything = true;
  } else {
    // その他の GET リクエストは短期キャッシュ（60秒）
    cacheOptions.cacheTtl = 60;
    cacheOptions.cacheEverything = true;
  }

  // Cloudflare の fetch オプションにキャッシュ設定を追加
  const fetchOptions: CloudflareRequestInit = {
    method: request.method,
    headers,
    body: request.body,
    cf: cacheOptions,
  };

  const response = await fetch(originUrl, fetchOptions);

  // レスポンスヘッダーをコピー
  const responseHeaders = new Headers(response.headers);

  // Set-Cookie ヘッダーを正しく処理
  // 複数の Set-Cookie ヘッダーがある場合、すべてを取得して Domain 属性を調整
  const setCookieHeaders = response.headers.getSetCookie?.() || [];
  if (setCookieHeaders.length > 0) {
    // 既存の Set-Cookie ヘッダーを削除
    responseHeaders.delete('Set-Cookie');
    // 各 Set-Cookie ヘッダーを追加（Domain 属性を現在のドメインに調整）
    for (const cookie of setCookieHeaders) {
      // Domain 属性を現在のドメインに調整（Vercel のドメインから Cloudflare のドメインへ）
      // Domain 属性が存在する場合は置換、存在しない場合は追加
      let adjustedCookie = cookie;
      const domainMatch = cookie.match(/Domain=([^;]+)/i);
      if (domainMatch) {
        // 既存の Domain 属性を現在のドメインに置換
        adjustedCookie = cookie.replace(/Domain=[^;]+/i, `Domain=${url.hostname}`);
      } else {
        // Domain 属性がない場合は追加（セミコロンの前に追加）
        const semicolonIndex = cookie.indexOf(';');
        if (semicolonIndex !== -1) {
          adjustedCookie = `${cookie.substring(0, semicolonIndex)}; Domain=${url.hostname}${cookie.substring(semicolonIndex)}`;
        } else {
          adjustedCookie = `${cookie}; Domain=${url.hostname}`;
        }
      }
      responseHeaders.append('Set-Cookie', adjustedCookie);
    }
  }

  // CORS ヘッダーを追加（認証が必要な場合は credentials を許可）
  const origin = request.headers.get('Origin');
  if (origin) {
    responseHeaders.set('Access-Control-Allow-Origin', origin);
    responseHeaders.set('Access-Control-Allow-Credentials', 'true');
  } else {
    responseHeaders.set('Access-Control-Allow-Origin', '*');
  }
  responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  responseHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie');

  // キャッシュ制御ヘッダーを設定
  if (isGet && !isPersonalized && !isApi) {
    if (isStatic) {
      // 静的アセットは長期キャッシュ
      responseHeaders.set(
        'Cache-Control',
        'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800',
      );
    } else {
      // HTML / JSON は短期キャッシュ
      responseHeaders.set(
        'Cache-Control',
        'public, max-age=60, s-maxage=60, stale-while-revalidate=300',
      );
    }
  } else {
    // パーソナライズされたリクエストや API はキャッシュしない
    responseHeaders.set('Cache-Control', 'private, no-store, no-cache, must-revalidate');
  }

  // オリジンの Cache-Control を尊重する場合（オプション）
  // ただし、上記の設定を優先する

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
  });
}

/**
 * Cloudflare Worker のエントリーポイント
 */
export default {
  async fetch(
    request: Request,
    env: Env,
    _ctx: { waitUntil: (promise: Promise<unknown>) => void; passThroughOnException: () => void },
  ): Promise<Response> {
    try {
      return await proxyToOrigin(request, env);
    } catch (error) {
      console.error('Proxy error:', error);
      return new Response('Internal Server Error', {
        status: 500,
        headers: {
          'Content-Type': 'text/plain',
        },
      });
    }
  },
};

