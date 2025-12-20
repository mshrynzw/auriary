import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Next.js 16のmiddleware警告を抑制（middleware.tsは引き続き有効）
  experimental: {
    // middleware.tsは引き続きサポートされているため、警告を無視
  },
};

export default nextConfig;
