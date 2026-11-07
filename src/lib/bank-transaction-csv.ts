/**
 * 明細一覧の CSV。画面の列順。Excel 向けに UTF-8 BOM と CRLF。
 */

export const bankTransactionCsvHeaders = ['日付', '取引名', '金額', '摘要', '用途', 'メモ'] as const;

export type BankTransactionCsvRow = {
  txn_date: string;
  txn_type: string;
  amount: number;
  description: string | null;
  purpose_id: number | null;
  memo: string | null;
};

export type BankTransactionCsvPurpose = {
  id: number;
  name: string;
};

function escapeCsv(value: string) {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replaceAll('"', '""')}"`;
  }
  return value;
}

export function bankTransactionCsv(
  rows: BankTransactionCsvRow[],
  purposes: BankTransactionCsvPurpose[],
): string {
  const purposeName = new Map(purposes.map((purpose) => [purpose.id, purpose.name]));
  const lines = [bankTransactionCsvHeaders.join(',')];
  for (const row of rows) {
    const purpose =
      row.purpose_id === null ? '未設定' : (purposeName.get(row.purpose_id) ?? '未設定');
    lines.push(
      [
        row.txn_date.replaceAll('-', '/'),
        row.txn_type,
        String(row.amount),
        row.description ?? '',
        purpose,
        row.memo ?? '',
      ]
        .map(escapeCsv)
        .join(','),
    );
  }
  return `\uFEFF${lines.join('\r\n')}\r\n`;
}
