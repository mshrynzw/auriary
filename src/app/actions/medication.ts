'use server';

import { requireAuth } from '@/lib/auth';

/**
 * 薬マスタ一覧を取得
 */
export async function getMedicationsAction() {
  const { supabase } = await requireAuth();

  const { data, error } = await supabase
    .from('m_medications')
    .select('id, name, generic_name')
    .is('deleted_at', null)
    .order('name', { ascending: true });

  if (error) {
    return {
      error: {
        code: 'INTERNAL_ERROR',
        message: '薬マスタの取得に失敗しました',
      },
    };
  }

  return { medications: data || [] };
}
