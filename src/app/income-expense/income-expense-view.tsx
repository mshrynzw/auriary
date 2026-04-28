'use client';

import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Loader2, Plus, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
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
  actualBalance: number | null;
  forecastBalance: number | null;
  isForecast: boolean;
};

type DepositAmountOverride = {
  id: number;
  yearMonth: string;
  amount: number;
};

type RecurringDeposit = {
  id: number;
  name: string;
  amount: number;
  dayOfMonth: number;
  evenMonthsOnly: boolean;
  adjustToBusinessDay: boolean;
  overrides: DepositAmountOverride[];
};

type RecurringWithdrawal = {
  id: number;
  name: string;
  amount: number;
  dayOfMonth: number;
};

type ForecastFormStorage = {
  currentBalance: number;
  dailyExpense: number;
  recurringDeposits: RecurringDeposit[];
  recurringWithdrawals: RecurringWithdrawal[];
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
const FORECAST_FORM_STORAGE_KEY = 'incomeExpenseForecastFormV1';

function formatYearMonth(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function addMonths(base: Date, months: number) {
  const next = new Date(base);
  next.setMonth(next.getMonth() + months);
  return next;
}

function isValidYearMonth(value: string) {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

function sanitizeDepositOverrides(value: unknown): DepositAmountOverride[] {
  if (!Array.isArray(value)) return [];
  const deduped = new Map<string, DepositAmountOverride>();
  for (const raw of value) {
    const yearMonth = typeof raw?.yearMonth === 'string' ? raw.yearMonth : '';
    if (!isValidYearMonth(yearMonth)) continue;
    const rawAmount = Number(raw?.amount);
    const amount = Number.isFinite(rawAmount) ? Math.max(0, Math.trunc(rawAmount)) : 0;
    const rawId = Number(raw?.id);
    const id = Number.isFinite(rawId) ? rawId : Date.now() + deduped.size;
    deduped.set(yearMonth, { id, yearMonth, amount });
  }
  return Array.from(deduped.values()).sort((a, b) => a.yearMonth.localeCompare(b.yearMonth));
}

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
      actualBalance: null,
      forecastBalance: null,
      isForecast: false,
    };

    if (row.txn_type === '支払') existing.paymentTotal += row.amount;
    if (row.txn_type === '入金') existing.depositTotal += row.amount;
    map.set(key, existing);
  }

  return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
}

function toDateText(date: Date) {
  return format(date, 'yyyy-MM-dd');
}

function addDays(base: Date, days: number) {
  const next = new Date(base);
  next.setDate(next.getDate() + days);
  return next;
}

function daysInMonth(year: number, monthIndex: number) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function adjustToPreviousBusinessDay(date: Date) {
  const adjusted = new Date(date);
  while (adjusted.getDay() === 0 || adjusted.getDay() === 6) {
    adjusted.setDate(adjusted.getDate() - 1);
  }
  return adjusted;
}

function buildBalanceSeries(
  dailyActuals: ChartPoint[],
  currentBalance: number,
  dailyExpense: number,
  recurringDeposits: RecurringDeposit[],
  recurringWithdrawals: RecurringWithdrawal[],
  forecastDays: number,
): ChartPoint[] {
  const points: ChartPoint[] = [];
  let balance = Math.trunc(currentBalance);

  if (dailyActuals.length > 0) {
    // `currentBalance` is treated as the latest actual-day balance.
    // Build historical balances backward so the latest point matches the input value.
    const actualPoints = dailyActuals.map((actual) => ({
      ...actual,
      actualBalance: 0,
      forecastBalance: null,
      isForecast: false,
    }));

    actualPoints[actualPoints.length - 1].actualBalance = balance;
    for (let i = actualPoints.length - 2; i >= 0; i -= 1) {
      const nextDay = dailyActuals[i + 1];
      balance -= nextDay.depositTotal - nextDay.paymentTotal;
      actualPoints[i].actualBalance = balance;
    }

    points.push(...actualPoints);
    balance = Math.trunc(currentBalance);
  } else {
    const today = new Date();
    points.push({
      date: toDateText(today),
      dateLabel: format(today, 'M/d', { locale: ja }),
      paymentTotal: 0,
      depositTotal: 0,
      actualBalance: balance,
      forecastBalance: null,
      isForecast: false,
    });
  }

  const lastDate = points[points.length - 1]?.date;
  const startDate = lastDate ? addDays(new Date(`${lastDate}T00:00:00`), 1) : new Date();

  for (let i = 0; i < forecastDays; i += 1) {
    const date = addDays(startDate, i);
    const yyyy = date.getFullYear();
    const mm = date.getMonth();
    const dd = date.getDate();
    const yearMonth = formatYearMonth(new Date(yyyy, mm, 1));

    const scheduledDeposit = recurringDeposits.reduce((sum, item) => {
      const monthNumber = mm + 1;
      if (item.evenMonthsOnly && monthNumber % 2 !== 0) {
        return sum;
      }
      const targetDay = Math.min(Math.max(1, item.dayOfMonth), daysInMonth(yyyy, mm));
      const targetDate = new Date(yyyy, mm, targetDay);
      const adjustedDate = item.adjustToBusinessDay
        ? adjustToPreviousBusinessDay(targetDate)
        : targetDate;
      const overrideAmount =
        item.overrides.find((override) => override.yearMonth === yearMonth)?.amount ?? item.amount;
      return dd === adjustedDate.getDate() ? sum + Math.trunc(overrideAmount) : sum;
    }, 0);

    const scheduledWithdrawal = recurringWithdrawals.reduce((sum, item) => {
      const targetDay = Math.min(Math.max(1, item.dayOfMonth), daysInMonth(yyyy, mm));
      return dd === targetDay ? sum + Math.trunc(item.amount) : sum;
    }, 0);
    const dailyExpenseAmount = Math.trunc(dailyExpense);
    const totalPayment = dailyExpenseAmount + scheduledWithdrawal;

    balance += scheduledDeposit - totalPayment;
    points.push({
      date: toDateText(date),
      dateLabel: format(date, 'M/d', { locale: ja }),
      paymentTotal: totalPayment,
      depositTotal: scheduledDeposit,
      actualBalance: null,
      forecastBalance: balance,
      isForecast: true,
    });
  }

  return points;
}

export function IncomeExpenseView({
  initialTransactions,
  isAuthenticated = false,
}: IncomeExpenseViewProps) {
  const [transactions, setTransactions] = useState<BankTransactionRow[]>(initialTransactions);
  const [isImporting, setIsImporting] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [currentBalance, setCurrentBalance] = useState(0);
  const [dailyExpense, setDailyExpense] = useState(0);
  const [recurringDeposits, setRecurringDeposits] = useState<RecurringDeposit[]>([
    {
      id: 1,
      name: '給与',
      amount: 0,
      dayOfMonth: 25,
      evenMonthsOnly: false,
      adjustToBusinessDay: false,
      overrides: [],
    },
  ]);
  const [recurringWithdrawals, setRecurringWithdrawals] = useState<RecurringWithdrawal[]>([
    { id: 1, name: '家賃', amount: 0, dayOfMonth: 27 },
  ]);
  const [isStorageLoaded, setIsStorageLoaded] = useState(false);

  const chartData = useMemo(
    () =>
      buildBalanceSeries(
        aggregateDaily(transactions),
        currentBalance,
        dailyExpense,
        recurringDeposits,
        recurringWithdrawals,
        365,
      ),
    [transactions, currentBalance, dailyExpense, recurringDeposits, recurringWithdrawals],
  );

  const onAddRecurringDeposit = () => {
    setRecurringDeposits((prev) => [
      ...prev,
      {
        id: Date.now(),
        name: '',
        amount: 0,
        dayOfMonth: 1,
        evenMonthsOnly: false,
        adjustToBusinessDay: false,
        overrides: [],
      },
    ]);
  };

  const onRemoveRecurringDeposit = (id: number) => {
    setRecurringDeposits((prev) => prev.filter((item) => item.id !== id));
  };

  const onChangeRecurringDeposit = (
    id: number,
    key: keyof Omit<RecurringDeposit, 'id' | 'overrides'>,
    value: string | number | boolean,
  ) => {
    setRecurringDeposits((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        if (key === 'name') {
          return { ...item, name: String(value) };
        }
        if (key === 'evenMonthsOnly') {
          return { ...item, evenMonthsOnly: Boolean(value) };
        }
        if (key === 'adjustToBusinessDay') {
          return { ...item, adjustToBusinessDay: Boolean(value) };
        }
        if (key === 'dayOfMonth') {
          const day = Number(value);
          return { ...item, dayOfMonth: Number.isFinite(day) ? Math.min(31, Math.max(1, day)) : 1 };
        }
        const amount = Number(value);
        return { ...item, amount: Number.isFinite(amount) ? Math.max(0, Math.trunc(amount)) : 0 };
      }),
    );
  };

  const onAddRecurringDepositOverride = (depositId: number) => {
    setRecurringDeposits((prev) =>
      prev.map((item) => {
        if (item.id !== depositId) return item;
        const usedYearMonths = new Set(item.overrides.map((override) => override.yearMonth));
        let nextYearMonth = formatYearMonth(new Date());
        let monthOffset = 0;
        while (usedYearMonths.has(nextYearMonth) && monthOffset < 240) {
          monthOffset += 1;
          nextYearMonth = formatYearMonth(addMonths(new Date(), monthOffset));
        }
        return {
          ...item,
          overrides: [
            ...item.overrides,
            {
              id: Date.now(),
              yearMonth: nextYearMonth,
              amount: Math.max(0, Math.trunc(item.amount)),
            },
          ].sort((a, b) => a.yearMonth.localeCompare(b.yearMonth)),
        };
      }),
    );
  };

  const onRemoveRecurringDepositOverride = (depositId: number, overrideId: number) => {
    setRecurringDeposits((prev) =>
      prev.map((item) =>
        item.id === depositId
          ? { ...item, overrides: item.overrides.filter((override) => override.id !== overrideId) }
          : item,
      ),
    );
  };

  const onChangeRecurringDepositOverride = (
    depositId: number,
    overrideId: number,
    key: keyof Omit<DepositAmountOverride, 'id'>,
    value: string | number,
  ) => {
    setRecurringDeposits((prev) =>
      prev.map((item) => {
        if (item.id !== depositId) return item;
        const nextOverrides = item.overrides.map((override) => {
          if (override.id !== overrideId) return override;
          if (key === 'yearMonth') {
            return { ...override, yearMonth: String(value) };
          }
          const amount = Number(value);
          return {
            ...override,
            amount: Number.isFinite(amount) ? Math.max(0, Math.trunc(amount)) : 0,
          };
        });
        if (key === 'yearMonth') {
          const target = nextOverrides.find((override) => override.id === overrideId);
          if (!target || !isValidYearMonth(target.yearMonth)) {
            return { ...item, overrides: nextOverrides };
          }
          const duplicated = nextOverrides.some(
            (override) => override.id !== overrideId && override.yearMonth === target.yearMonth,
          );
          if (duplicated) {
            toast.error('同じ年月の確定額は1つだけ登録できます');
            return item;
          }
        }
        return {
          ...item,
          overrides: nextOverrides.sort((a, b) => a.yearMonth.localeCompare(b.yearMonth)),
        };
      }),
    );
  };

  const onAddRecurringWithdrawal = () => {
    setRecurringWithdrawals((prev) => [
      ...prev,
      { id: Date.now(), name: '', amount: 0, dayOfMonth: 1 },
    ]);
  };

  const onRemoveRecurringWithdrawal = (id: number) => {
    setRecurringWithdrawals((prev) => prev.filter((item) => item.id !== id));
  };

  const onChangeRecurringWithdrawal = (
    id: number,
    key: keyof Omit<RecurringWithdrawal, 'id'>,
    value: string | number,
  ) => {
    setRecurringWithdrawals((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        if (key === 'name') {
          return { ...item, name: String(value) };
        }
        if (key === 'dayOfMonth') {
          const day = Number(value);
          return { ...item, dayOfMonth: Number.isFinite(day) ? Math.min(31, Math.max(1, day)) : 1 };
        }
        const amount = Number(value);
        return { ...item, amount: Number.isFinite(amount) ? Math.max(0, Math.trunc(amount)) : 0 };
      }),
    );
  };

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(FORECAST_FORM_STORAGE_KEY);
      if (!raw) {
        setIsStorageLoaded(true);
        return;
      }
      const parsed = JSON.parse(raw) as Partial<ForecastFormStorage>;

      const nextCurrentBalance = Number(parsed.currentBalance);
      const nextDailyExpense = Number(parsed.dailyExpense);
      setCurrentBalance(
        Number.isFinite(nextCurrentBalance) ? Math.max(0, Math.trunc(nextCurrentBalance)) : 0,
      );
      setDailyExpense(
        Number.isFinite(nextDailyExpense) ? Math.max(0, Math.trunc(nextDailyExpense)) : 0,
      );

      if (Array.isArray(parsed.recurringDeposits) && parsed.recurringDeposits.length > 0) {
        const safeDeposits = parsed.recurringDeposits.map((item, index) => ({
          id: Number.isFinite(Number(item.id)) ? Number(item.id) : Date.now() + index,
          name: typeof item.name === 'string' ? item.name : '',
          amount: Number.isFinite(Number(item.amount))
            ? Math.max(0, Math.trunc(Number(item.amount)))
            : 0,
          dayOfMonth: Number.isFinite(Number(item.dayOfMonth))
            ? Math.min(31, Math.max(1, Math.trunc(Number(item.dayOfMonth))))
            : 1,
          evenMonthsOnly: Boolean(item.evenMonthsOnly),
          adjustToBusinessDay: Boolean(item.adjustToBusinessDay),
          overrides: sanitizeDepositOverrides(item.overrides),
        }));
        setRecurringDeposits(safeDeposits);
      }

      if (Array.isArray(parsed.recurringWithdrawals) && parsed.recurringWithdrawals.length > 0) {
        const safeWithdrawals = parsed.recurringWithdrawals.map((item, index) => ({
          id: Number.isFinite(Number(item.id)) ? Number(item.id) : Date.now() + index,
          name: typeof item.name === 'string' ? item.name : '',
          amount: Number.isFinite(Number(item.amount))
            ? Math.max(0, Math.trunc(Number(item.amount)))
            : 0,
          dayOfMonth: Number.isFinite(Number(item.dayOfMonth))
            ? Math.min(31, Math.max(1, Math.trunc(Number(item.dayOfMonth))))
            : 1,
        }));
        setRecurringWithdrawals(safeWithdrawals);
      }
    } catch (error) {
      console.error('failed to load forecast form from localStorage', error);
    } finally {
      setIsStorageLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!isStorageLoaded) return;
    const payload: ForecastFormStorage = {
      currentBalance,
      dailyExpense,
      recurringDeposits,
      recurringWithdrawals,
    };
    window.localStorage.setItem(FORECAST_FORM_STORAGE_KEY, JSON.stringify(payload));
  }, [isStorageLoaded, currentBalance, dailyExpense, recurringDeposits, recurringWithdrawals]);

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
          <CardTitle>未来推移の設定</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">現在残高（円）</label>
              <Input
                type="number"
                min={0}
                step={1000}
                value={currentBalance}
                onChange={(e) =>
                  setCurrentBalance(Math.max(0, Math.trunc(Number(e.target.value) || 0)))
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">1日あたり消費額（円）</label>
              <Input
                type="number"
                min={0}
                step={100}
                value={dailyExpense}
                onChange={(e) =>
                  setDailyExpense(Math.max(0, Math.trunc(Number(e.target.value) || 0)))
                }
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">毎月の入金予定</p>
              <Button type="button" variant="outline" size="sm" onClick={onAddRecurringDeposit}>
                <Plus className="mr-2 h-4 w-4" />
                項目を追加
              </Button>
            </div>
            {recurringDeposits.map((item) => (
              <div
                key={item.id}
                className="grid gap-2 rounded-md border p-3 md:grid-cols-[1fr_140px_120px_140px_180px_auto]"
              >
                <Input
                  placeholder="例: 年金"
                  value={item.name}
                  onChange={(e) => onChangeRecurringDeposit(item.id, 'name', e.target.value)}
                />
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    min={0}
                    step={1000}
                    placeholder="金額"
                    value={item.amount}
                    onChange={(e) => onChangeRecurringDeposit(item.id, 'amount', e.target.value)}
                  />
                  円
                </div>
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    min={1}
                    max={31}
                    placeholder="入金日"
                    value={item.dayOfMonth}
                    onChange={(e) =>
                      onChangeRecurringDeposit(item.id, 'dayOfMonth', e.target.value)
                    }
                  />
                  日
                </div>
                <label className="flex items-center gap-2 rounded-md border px-3 text-sm">
                  <input
                    type="checkbox"
                    checked={item.evenMonthsOnly}
                    onChange={(e) =>
                      onChangeRecurringDeposit(item.id, 'evenMonthsOnly', e.target.checked)
                    }
                  />
                  偶数月のみ
                </label>
                <label className="flex items-center gap-2 rounded-md border px-3 text-sm">
                  <input
                    type="checkbox"
                    checked={item.adjustToBusinessDay}
                    onChange={(e) =>
                      onChangeRecurringDeposit(item.id, 'adjustToBusinessDay', e.target.checked)
                    }
                  />
                  休日は前営業日
                </label>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => onRemoveRecurringDeposit(item.id)}
                  disabled={recurringDeposits.length <= 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <div className="space-y-2 rounded-md border border-dashed p-3 md:col-span-6">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{item.name || '入金項目'}の確定額（年月別）</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onAddRecurringDepositOverride(item.id)}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      確定額を追加
                    </Button>
                  </div>
                  {item.overrides.length === 0 ? (
                    <p className="text-sm text-muted-foreground">未登録（予想額が使われます）</p>
                  ) : (
                    item.overrides.map((override) => (
                      <div
                        key={override.id}
                        className="grid gap-2 md:grid-cols-[180px_1fr_auto] md:items-center"
                      >
                        <Input
                          type="month"
                          value={override.yearMonth}
                          onChange={(e) =>
                            onChangeRecurringDepositOverride(
                              item.id,
                              override.id,
                              'yearMonth',
                              e.target.value,
                            )
                          }
                        />
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            min={0}
                            step={1000}
                            placeholder="入金予定額"
                            value={override.amount}
                            onChange={(e) =>
                              onChangeRecurringDepositOverride(
                                item.id,
                                override.id,
                                'amount',
                                e.target.value,
                              )
                            }
                          />
                          円
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => onRemoveRecurringDepositOverride(item.id, override.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">毎月の出金予定</p>
              <Button type="button" variant="outline" size="sm" onClick={onAddRecurringWithdrawal}>
                <Plus className="mr-2 h-4 w-4" />
                項目を追加
              </Button>
            </div>
            {recurringWithdrawals.map((item) => (
              <div
                key={item.id}
                className="grid gap-2 rounded-md border p-3 md:grid-cols-[1fr_140px_120px_auto]"
              >
                <Input
                  placeholder="例: 家賃"
                  value={item.name}
                  onChange={(e) => onChangeRecurringWithdrawal(item.id, 'name', e.target.value)}
                />
                <Input
                  type="number"
                  min={0}
                  step={1000}
                  placeholder="金額"
                  value={item.amount}
                  onChange={(e) => onChangeRecurringWithdrawal(item.id, 'amount', e.target.value)}
                />
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    min={1}
                    max={31}
                    placeholder="出金日"
                    value={item.dayOfMonth}
                    onChange={(e) =>
                      onChangeRecurringWithdrawal(item.id, 'dayOfMonth', e.target.value)
                    }
                  />
                  日
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => onRemoveRecurringWithdrawal(item.id)}
                  disabled={recurringWithdrawals.length <= 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
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
                  fill="rgba(234, 179, 8, 1.00)"
                  stroke="#f59e0b"
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
                <Line
                  type="monotone"
                  dataKey="actualBalance"
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={false}
                  name="残高推移（実績）"
                />
                <Line
                  type="monotone"
                  dataKey="forecastBalance"
                  stroke="#22c55e"
                  strokeWidth={2}
                  strokeDasharray="6 6"
                  dot={false}
                  name="残高推移（予測）"
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
