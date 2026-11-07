/**
 * ダッシュボードの用途グラフ。支払だけを、今週・今月・今年を含む直近の期間に分ける。
 */

import { addWeeks, format, startOfWeek } from 'date-fns';
import { ja } from 'date-fns/locale';
import {
  bankPurposeTextColor,
  defaultBankPurposeTextColor,
} from '@/schemas/tables/m_bank_purposes';

export const purposeChartMonthOptions = [1, 3, 6, 12] as const;
export type PurposeChartMonthCount = (typeof purposeChartMonthOptions)[number];
export const defaultPurposeChartMonthCount: PurposeChartMonthCount = 3;

export const purposeChartGranularities = ['week', 'month', 'year'] as const;
export type PurposeChartGranularity = (typeof purposeChartGranularities)[number];
export const defaultPurposeChartGranularity: PurposeChartGranularity = 'month';

export const unsetPurposeChartKey = 'unset';
export const unsetPurposeChartName = '未設定';
export const unsetPurposeChartColor = defaultBankPurposeTextColor;

export type PurposeChartPurpose = {
  id: number;
  name: string;
  text_color: string;
};

export type PurposeChartTransaction = {
  txn_date: string;
  txn_type: string;
  amount: number;
  purpose_id: number | null;
};

export type PurposeChartSeries = {
  key: string;
  name: string;
  color: string;
};

export type PurposeChartSlice = PurposeChartSeries & {
  amount: number;
};

export type PurposeChartMonth = {
  key: string;
  label: string;
  total: number;
  slices: PurposeChartSlice[];
};

export type PurposeChart = {
  months: PurposeChartMonth[];
  series: PurposeChartSeries[];
};

export function isPurposeChartMonthCount(value: number): value is PurposeChartMonthCount {
  return purposeChartMonthOptions.some((option) => option === value);
}

export function isPurposeChartGranularity(value: string): value is PurposeChartGranularity {
  return purposeChartGranularities.some((option) => option === value);
}

export function purposeChartPeriodLabel(count: number, granularity: PurposeChartGranularity) {
  if (granularity === 'week') return `過去${count}週`;
  if (granularity === 'year') return `過去${count}年`;
  return `過去${count}か月`;
}

function parseTxnDate(txnDate: string) {
  const [year, month, day] = txnDate.split('-').map(Number);
  return new Date(year ?? 1970, (month ?? 1) - 1, day ?? 1);
}

function weekStart(date: Date) {
  return startOfWeek(date, { weekStartsOn: 1 });
}

export function recentPurposeMonths(now: Date, monthCount: number): Array<{ key: string; label: string }> {
  const end = new Date(now.getFullYear(), now.getMonth(), 1);
  const start = new Date(end.getFullYear(), end.getMonth() - (monthCount - 1), 1);
  const includeYear = start.getFullYear() !== end.getFullYear();
  const months = [];
  for (let index = 0; index < monthCount; index += 1) {
    const date = new Date(start.getFullYear(), start.getMonth() + index, 1);
    months.push({
      key: format(date, 'yyyy-MM'),
      label: format(date, includeYear ? 'yyyy年M月' : 'M月', { locale: ja }),
    });
  }
  return months;
}

export function recentPurposeBuckets(
  now: Date,
  count: number,
  granularity: PurposeChartGranularity,
): Array<{ key: string; label: string }> {
  if (granularity === 'month') return recentPurposeMonths(now, count);
  if (granularity === 'year') {
    const endYear = now.getFullYear();
    const startYear = endYear - (count - 1);
    return Array.from({ length: count }, (_, index) => {
      const year = startYear + index;
      return { key: String(year), label: `${year}年` };
    });
  }

  const end = weekStart(now);
  const start = addWeeks(end, -(count - 1));
  const includeYear = start.getFullYear() !== end.getFullYear();
  return Array.from({ length: count }, (_, index) => {
    const date = addWeeks(start, index);
    return {
      key: format(date, 'yyyy-MM-dd'),
      label: format(date, includeYear ? 'yyyy/M/d' : 'M/d', { locale: ja }),
    };
  });
}

function transactionBucketKey(txnDate: string, granularity: PurposeChartGranularity) {
  if (granularity === 'month') return txnDate.slice(0, 7);
  if (granularity === 'year') return txnDate.slice(0, 4);
  return format(weekStart(parseTxnDate(txnDate)), 'yyyy-MM-dd');
}

export function aggregatePurposeSpending(
  now: Date,
  monthCount: number,
  transactions: PurposeChartTransaction[],
  purposes: PurposeChartPurpose[],
  granularity: PurposeChartGranularity = 'month',
): PurposeChart {
  const months = recentPurposeBuckets(now, monthCount, granularity);
  const totals = new Map<string, Map<string, number>>(
    months.map((month) => [month.key, new Map()]),
  );
  const purposeById = new Map(purposes.map((purpose) => [purpose.id, purpose]));

  for (const transaction of transactions) {
    if (transaction.txn_type !== '支払') continue;
    const bucket = totals.get(transactionBucketKey(transaction.txn_date, granularity));
    if (!bucket) continue;
    const purpose =
      transaction.purpose_id === null ? undefined : purposeById.get(transaction.purpose_id);
    const key = purpose ? `purpose-${purpose.id}` : unsetPurposeChartKey;
    bucket.set(key, (bucket.get(key) ?? 0) + transaction.amount);
  }

  const series: PurposeChartSeries[] = [];
  for (const purpose of purposes) {
    const key = `purpose-${purpose.id}`;
    if ([...totals.values()].some((bucket) => (bucket.get(key) ?? 0) > 0)) {
      series.push({
        key,
        name: purpose.name,
        color: bankPurposeTextColor(purpose.text_color),
      });
    }
  }
  if ([...totals.values()].some((bucket) => (bucket.get(unsetPurposeChartKey) ?? 0) > 0)) {
    series.push({
      key: unsetPurposeChartKey,
      name: unsetPurposeChartName,
      color: unsetPurposeChartColor,
    });
  }

  return {
    series,
    months: months.map((month) => {
      const bucket = totals.get(month.key) ?? new Map<string, number>();
      const slices = series
        .map((item) => ({ ...item, amount: bucket.get(item.key) ?? 0 }))
        .filter((item) => item.amount > 0);
      return {
        ...month,
        total: slices.reduce((sum, item) => sum + item.amount, 0),
        slices,
      };
    }),
  };
}

/** 円グラフは新しい期間を上にする。棒グラフは古い期間を左にする。 */
export function purposeShareBuckets(chart: PurposeChart): PurposeChartMonth[] {
  return [...chart.months].reverse();
}

export function purposeBarRows(chart: PurposeChart): Array<Record<string, string | number>> {
  return chart.months.map((month) => {
    const row: Record<string, string | number> = { label: month.label };
    for (const item of chart.series) {
      row[item.key] = month.slices.find((slice) => slice.key === item.key)?.amount ?? 0;
    }
    return row;
  });
}

export function purposeSharePercent(amount: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((amount / total) * 100);
}
