'use server';

import { requireAuth } from '@/lib/auth';
import { getDatabase } from '@/lib/db';
import { queryAll, readId, readRows } from '@/lib/sql';

/**
 * 薬マスタ一覧を取得
 */
export async function getMedicationsAction() {
  await requireAuth();

  try {
    const db = await getDatabase();
    const rows = readRows(
      await queryAll(
        db,
        'SELECT id, name, generic_name, memo FROM m_medications WHERE deleted_at IS NULL ORDER BY name ASC',
      ),
    );
    const medications = rows.flatMap((row) => {
      const id = readId(row.id);
      if (id === null || typeof row.name !== 'string') {
        return [];
      }
      return [
        {
          id,
          name: row.name,
          generic_name: typeof row.generic_name === 'string' ? row.generic_name : null,
          memo: typeof row.memo === 'string' ? row.memo : null,
        },
      ];
    });
    return { medications };
  } catch (error) {
    console.error(
      '薬マスタの取得に失敗しました',
      error instanceof Error ? error.message : 'unknown',
    );
    return {
      error: {
        code: 'INTERNAL_ERROR',
        message: '薬マスタの取得に失敗しました',
      },
    };
  }
}
