import { defineCloudflareConfig } from '@opennextjs/cloudflare';

/**
 * 画面は force-dynamic なので、増分キャッシュ用の R2 は作らない。
 * 遠隔のバケットをデプロイ前に用意しなくて済む。
 */
export default defineCloudflareConfig({
  incrementalCache: 'dummy',
});
