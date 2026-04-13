'use client';

import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Loader2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { type BankTransactionRow } from '@/schemas';
import { replaceBankTransactionsAction } from '@/app/actions/bank-transaction';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type IncomeExpenseViewProps = {
  initialTransactions: BankTransactionRow[];
  isAuthenticated?: boolean;
};

type CsvImportRecord = {
  txn_date: string;
  txn_type: '支払' | '入金';
  amount: number;
  description: string | null;
};

type ChartPoint = {
  date: string;
  dateLabel: string;
  paymentTotal: number;
  depositTotal: number;
};

const REQUIRED_COLUMNS = [
  'レコード区分',
  '取引名',
  '取扱日付　年',
  '取扱日付　月',
  '取扱日付　日',
  '金額',
  '摘要',
] as const;

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === ',' && !inQuotes) {
      out.push(cur);
      cur = '';
      continue;
    }
    cur += ch;
  }
  out.push(cur);
  return out.map((v) => v.trim());
}

function parseBankCsvText(text: string): CsvImportRecord[] {
  const lines = text
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length <= 1) return [];
  const header = parseCsvLine(lines[0]);
  const headerMap = new Map(header.map((name, idx) => [name, idx]));

  for (const col of REQUIRED_COLUMNS) {
    if (!headerMap.has(col)) {
      throw new Error(`CSVヘッダーに "${col}" がありません`);
    }
  }

  const getValue = (cols: string[], name: (typeof REQUIRED_COLUMNS)[number]) =>
    cols[headerMap.get(name)!] ?? '';

  const records: CsvImportRecord[] = [];
  for (let i = 1; i < lines.length; i += 1) {
    const cols = parseCsvLine(lines[i]);
    const recType = getValue(cols, 'レコード区分');
    if (recType !== '明細') continue;

    const txnTypeRaw = getValue(cols, '取引名');
    if (txnTypeRaw !== '支払' && txnTypeRaw !== '入金') continue;

    const year = Number(getValue(cols, '取扱日付　年'));
    const month = Number(getValue(cols, '取扱日付　月'));
    const day = Number(getValue(cols, '取扱日付　日'));
    if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) continue;

    const yyyy = String(year).padStart(4, '0');
    const mm = String(month).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    const txnDate = `${yyyy}-${mm}-${dd}`;

    const amount = Number(getValue(cols, '金額').replace(/,/g, ''));
    if (!Number.isFinite(amount)) continue;

    const description = getValue(cols, '摘要') || null;

    records.push({
      txn_date: txnDate,
      txn_type: txnTypeRaw,
      amount: Math.max(0, Math.trunc(amount)),
      description,
    });
  }

  return records;
}

function aggregateDaily(transactions: BankTransactionRow[]): ChartPoint[] {
  const map = new Map<string, ChartPoint>();
  for (const row of transactions) {
    const key = row.txn_date;
    const existing = map.get(key) ?? {
      date: key,
      dateLabel: format(new Date(`${key}T00:00:00`), 'M/d', { locale: ja }),
      paymentTotal: 0,
      depositTotal: 0,
    };

    if (row.txn_type === '支払') existing.paymentTotal += row.amount;
    if (row.txn_type === '入金') existing.depositTotal += row.amount;
    map.set(key, existing);
  }

  return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
}

export function IncomeExpenseView({
  initialTransactions,
  isAuthenticated = false,
}: IncomeExpenseViewProps) {
  const [transactions, setTransactions] = useState<BankTransactionRow[]>(initialTransactions);
  const [isImporting, setIsImporting] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

  const chartData = useMemo(() => aggregateDaily(transactions), [transactions]);

  const onImportCsv = async (formData: FormData) => {
    if (!isAuthenticated) {
      toast.error('ログイン後にご利用ください');
      return;
    }
    const file = formData.get('csv') as File | null;
    if (!file) {
      toast.error('CSVファイルを選択してください');
      return;
    }

    setIsImporting(true);
    try {
      const bytes = await file.arrayBuffer();
      const text = new TextDecoder('shift-jis').decode(bytes);
      const records = parseBankCsvText(text);
      if (records.length === 0) {
        toast.error('取り込み対象の明細が見つかりませんでした');
        return;
      }

      const result = await replaceBankTransactionsAction({
        source_file_name: file.name,
        records,
      });

      if ('error' in result && result.error) {
        toast.error(result.error.message);
        return;
      }

      const replacedStart = result.startDate;
      const replacedEnd = result.endDate;
      const untouched = transactions.filter(
        (t) => t.txn_date < replacedStart || t.txn_date > replacedEnd,
      );

      const importedRows: BankTransactionRow[] = records.map((r, idx) => ({
        id: -(idx + 1),
        user_id: 0 as BankTransactionRow['user_id'],
        txn_date: r.txn_date,
        txn_type: r.txn_type,
        amount: r.amount,
        description: r.description,
        source_file_name: file.name,
        source_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        deleted_at: null,
        created_by: '' as BankTransactionRow['created_by'],
        updated_by: '' as BankTransactionRow['updated_by'],
        deleted_by: null,
      }));

      const merged = [...untouched, ...importedRows].sort((a, b) =>
        a.txn_date === b.txn_date ? b.id - a.id : b.txn_date.localeCompare(a.txn_date),
      );
      setTransactions(merged);
      setSelectedFileName(file.name);
      toast.success(`${result.importedCount}件を取り込みました（期間は上書き）`);
    } catch (error) {
      console.error(error);
      toast.error('CSVの取り込みに失敗しました');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>収支CSVアップロード</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={onImportCsv} className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Input
              name="csv"
              type="file"
              accept=".csv,text/csv"
              className="max-w-lg cursor-pointer"
              onChange={(e) => setSelectedFileName(e.target.files?.[0]?.name ?? null)}
              disabled={isImporting}
            />
            <Button type="submit" disabled={isImporting} className="cursor-pointer">
              {isImporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  取り込み中...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  取り込み
                </>
              )}
            </Button>
          </form>
          <p className="mt-3 text-sm text-muted-foreground">
            SJISの銀行CSVを取り込みます。同期間の既存データは上書きされます。
            {selectedFileName ? ` 選択中: ${selectedFileName}` : ''}
          </p>
        </CardContent>
      </Card>

      <Card className="border-none bg-muted/80">
        <CardHeader>
          <CardTitle>日次の入出金（合計）</CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">データがありません</div>
          ) : (
            <ResponsiveContainer width="100%" height={380}>
              <ComposedChart data={chartData} margin={{ top: 5, right: 24, left: 0, bottom: 24 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.129 0.042 264.695)" />
                <XAxis
                  dataKey="dateLabel"
                  tick={{ fontSize: 12, fill: 'oklch(0.129 0.042 264.695)' }}
                  stroke="oklch(0.129 0.042 264.695)"
                />
                <YAxis
                  tick={{ fontSize: 12, fill: 'oklch(0.129 0.042 264.695)' }}
                  stroke="oklch(0.129 0.042 264.695)"
                />
                <RechartsTooltip
                  formatter={(value: number) => `${value.toLocaleString('ja-JP')}円`}
                  labelFormatter={(label, payload) => {
                    const date = payload?.[0]?.payload?.date;
                    if (!date) return label;
                    return format(new Date(`${date}T00:00:00`), 'yyyy年M月d日', { locale: ja });
                  }}
                />
                <Legend />
                <Bar
                  dataKey="paymentTotal"
                  fill="rgba(234, 179, 8, 0.10)"
                  stroke="#b8ae93"
                  strokeWidth={1}
                  name="支払（合計）"
                  barSize={8}
                />
                <Bar
                  dataKey="depositTotal"
                  fill="rgba(6, 182, 212, 0.25)"
                  stroke="#06b6d4"
                  strokeWidth={1}
                  name="入金（合計）"
                  barSize={8}
                />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>明細一覧</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">明細がありません</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>日付</TableHead>
                  <TableHead>取引名</TableHead>
                  <TableHead className="text-right">金額</TableHead>
                  <TableHead>摘要</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((row, idx) => (
                  <TableRow key={`${row.txn_date}-${row.id}-${idx}`}>
                    <TableCell>
                      {format(new Date(`${row.txn_date}T00:00:00`), 'yyyy/MM/dd', { locale: ja })}
                    </TableCell>
                    <TableCell
                      className={row.txn_type === '支払' ? 'text-red-600' : 'text-cyan-600'}
                    >
                      {row.txn_type}
                    </TableCell>
                    <TableCell className="text-right">
                      {row.amount.toLocaleString('ja-JP')}
                    </TableCell>
                    <TableCell className="max-w-[460px] truncate">
                      {row.description ?? '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
