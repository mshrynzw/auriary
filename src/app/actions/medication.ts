'use server';

import { requireAuth } from '@/lib/auth';
import { medicationRowSchema } from '@/schemas';

/**
 * 薬マスタ一覧を取得
 */
export async function getMedicationsAction() {
  const { supabase } = await requireAuth();

  const { data, error } = await supabase
    .from('m_medications')
    .select('*')
    .is('deleted_at', null)
    .order('name', { ascending: true });

  if (error) {
    console.error('Failed to fetch medications:', error);
    return {
      error: {
        code: 'INTERNAL_ERROR',
        message: '薬マスタの取得に失敗しました',
      },
    };
  }

  // 型安全性を確保するためにZodスキーマで検証
  const parsedMedications = medicationRowSchema.array().safeParse(data);

  if (!parsedMedications.success) {
    console.error('Failed to parse medications:', parsedMedications.error);
    return {
      error: {
        code: 'PARSE_ERROR',
        message: '薬マスタのデータ形式が不正です',
      },
    };
  }

  return { medications: parsedMedications.data };
}
