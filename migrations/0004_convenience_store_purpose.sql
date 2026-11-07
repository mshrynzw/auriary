-- 2026-10-31 までの指定摘要を、本人の用途「無駄遣い」にする。
-- その用途が無いユーザーの行は変えない。11月以降は変えない。

UPDATE t_bank_transactions
SET
  purpose_id = (
    SELECT id
    FROM m_bank_purposes
    WHERE user_id = t_bank_transactions.user_id
      AND name = '無駄遣い'
      AND deleted_at IS NULL
  ),
  updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
  updated_by = user_id
WHERE deleted_at IS NULL
  AND txn_date <= '2026-10-31'
  AND description IN (
    'セブン－イレブン',
    'SEVEN-ELEVEN',
    'FAMILYMART',
    'フアミリ―マ―トサツポロタヌキコウジロ',
    'フアミリ―マ―トツキサムヒガシゴジヨ',
    'フアミリ―マ―トサツポロミナミニジヨウ'
  )
  AND EXISTS (
    SELECT 1
    FROM m_bank_purposes
    WHERE user_id = t_bank_transactions.user_id
      AND name = '無駄遣い'
      AND deleted_at IS NULL
  );
