/**
 * @vitest-environment node
 */
import { describe, expect, it } from 'vitest';
import { bankTransactionCsv } from './bank-transaction-csv';

describe('明細一覧の CSV', () => {
  it('画面の列順で、用途名と未設定を出す', () => {
    const csv = bankTransactionCsv(
      [
        {
          txn_date: '2026-11-06',
          txn_type: '支払',
          amount: 278,
          description: 'SEVEN-ELEVEN',
          purpose_id: 2,
          memo: '買い食い',
        },
        {
          txn_date: '2026-11-04',
          txn_type: '入金',
          amount: 1475,
          description: null,
          purpose_id: null,
          memo: null,
        },
      ],
      [{ id: 2, name: '無駄遣い' }],
    );

    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(csv.slice(1)).toBe(
      ['日付,取引名,金額,摘要,用途,メモ', '2026/11/06,支払,278,SEVEN-ELEVEN,無駄遣い,買い食い', '2026/11/04,入金,1475,,未設定,', ''].join(
        '\r\n',
      ),
    );
  });

  it('カンマと引用符を含む摘要を囲む', () => {
    const csv = bankTransactionCsv(
      [
        {
          txn_date: '2026-11-01',
          txn_type: '支払',
          amount: 100,
          description: 'A, "B"',
          purpose_id: 9,
          memo: '1行目\n2行目',
        },
      ],
      [],
    );

    expect(csv).toContain('"A, ""B"""');
    expect(csv).toContain('"1行目\n2行目"');
    expect(csv).toContain(',未設定,');
  });
});
