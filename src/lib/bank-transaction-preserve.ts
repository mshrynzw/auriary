/**
 * CSV の再取り込みで行が作り直されても、同じ明細のメモと用途を並び順どおり残す。
 */

export type PreservedBankTransaction = {
  id: number;
  txn_date: string;
  txn_type: string;
  amount: number;
  description: string | null;
  memo: string | null;
  purposeId: number | null;
};

export type IncomingBankTransaction = {
  txn_date: string;
  txn_type: string;
  amount: number;
  description?: string | null;
};

export type PreservedBankFields = {
  memo: string | null;
  purposeId: number | null;
};

const EMPTY_FIELDS: PreservedBankFields = { memo: null, purposeId: null };

function matchKey(row: {
  txn_date: string;
  txn_type: string;
  amount: number;
  description?: string | null;
}) {
  return JSON.stringify([row.txn_date, row.txn_type, row.amount, row.description ?? null]);
}

export function assignPreservedBankFields(
  existing: PreservedBankTransaction[],
  records: IncomingBankTransaction[],
): PreservedBankFields[] {
  const queues = new Map<string, PreservedBankFields[]>();
  const sorted = [...existing].sort((left, right) => left.id - right.id);
  for (const row of sorted) {
    const key = matchKey(row);
    const fields = { memo: row.memo ?? null, purposeId: row.purposeId ?? null };
    const queue = queues.get(key);
    if (queue) queue.push(fields);
    else queues.set(key, [fields]);
  }

  return records.map((record) => {
    const queue = queues.get(matchKey(record));
    if (!queue || queue.length === 0) return { ...EMPTY_FIELDS };
    return queue.shift() ?? { ...EMPTY_FIELDS };
  });
}
