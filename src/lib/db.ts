/**
 * セッションと Server Actions が使うデータベース。
 * Workers と next dev では D1 の binding `DB` を使う。
 * binding が無い開発時だけ、ローカルの SQLite ファイルを開く。
 */

import { getCloudflareContext } from '@opennextjs/cloudflare';
import type { SessionDatabase } from '@/lib/auth/session';
import { asD1SessionDatabase, readD1Binding } from './db-binding';

export async function getDatabase(): Promise<SessionDatabase> {
  const binding = await readRequestBinding();
  if (binding) {
    return asD1SessionDatabase(binding);
  }
  if (process.env.NODE_ENV !== 'production') {
    const { getLocalDatabase } = await import('./db-local');
    return getLocalDatabase();
  }
  throw new Error('D1 の binding DB がありません');
}

async function readRequestBinding() {
  try {
    const { env } = await getCloudflareContext({ async: true });
    return readD1Binding(env);
  } catch (error) {
    if (process.env.NODE_ENV === 'production') {
      throw error;
    }
    return null;
  }
}
