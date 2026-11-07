/**
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest';
import { assignPreservedBankFields, type PreservedBankTransaction } from './bank-transaction-preserve';

function row(
  id: number,
  memo: string | null,
  purposeId: number | null,
): PreservedBankTransaction {
  return {
    id,
    txn_date: '2026-11-06',
    txn_type: '支払',
    amount: 278,
    description: 'SEVEN-ELEVEN',
    memo,
    purposeId,
  };
}

describe('明細の再取り込みでメモと用途を残す', () => {
  it('同じ日付・取引名・金額・摘要の行へ、元の並び順で戻す', () => {
    const preserved = assignPreservedBankFields(
      [row(2, '夜', 8), row(1, '朝', 3)],
      [
        {
          txn_date: '2026-11-06',
          txn_type: '支払',
          amount: 278,
          description: 'SEVEN-ELEVEN',
        },
        {
          txn_date: '2026-11-06',
          txn_type: '支払',
          amount: 278,
          description: 'SEVEN-ELEVEN',
        },
      ],
    );

    expect(preserved).toEqual([
      { memo: '朝', purposeId: 3 },
      { memo: '夜', purposeId: 8 },
    ]);
  });

  it('一致しない行はメモも用途も空にする', () => {
    const preserved = assignPreservedBankFields(
      [row(1, '朝', 3)],
      [
        {
          txn_date: '2026-11-06',
          txn_type: '支払',
          amount: 999,
          description: 'SEVEN-ELEVEN',
        },
      ],
    );

    expect(preserved).toEqual([{ memo: null, purposeId: null }]);
  });
});
