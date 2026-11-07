/**
 * ダッシュボードの用途グラフ。支払だけを、今月を含む直近の月に分ける。
 */

import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { bankPurposeTextColor } from '@/schemas/tables/m_bank_purposes';

export const purposeChartMonthOptions = [1, 3, 6, 12] as const;
export type PurposeChartMonthCount = (typeof purposeChartMonthOptions)[number];
export const defaultPurposeChartMonthCount: PurposeChartMonthCount = 3;

export const unsetPurposeChartKey = 'unset';
export const unsetPurposeChartName = '未設定';
export const unsetPurposeChartColor = '#000000';

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

export function aggregatePurposeSpending(
  now: Date,
  monthCount: number,
  transactions: PurposeChartTransaction[],
  purposes: PurposeChartPurpose[],
): PurposeChart {
  const months = recentPurposeMonths(now, monthCount);
  const totals = new Map<string, Map<string, number>>(
    months.map((month) => [month.key, new Map()]),
  );
  const purposeById = new Map(purposes.map((purpose) => [purpose.id, purpose]));

  for (const transaction of transactions) {
    if (transaction.txn_type !== '支払') continue;
    const bucket = totals.get(transaction.txn_date.slice(0, 7));
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
