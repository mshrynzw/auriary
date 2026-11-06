import type { NextConfig } from 'next';
import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare';

// next dev のときだけ、wrangler のローカル binding をサーバーから読めるようにする。
if (process.env.NODE_ENV === 'development') {
  void initOpenNextCloudflareForDev();
}

const nextConfig: NextConfig = {
  // Next.js 16 では proxy.ts を使う。middleware.ts は作らない。
  // https://nextjs.org/docs/app/api-reference/file-conventions/proxy
};

export default nextConfig;
