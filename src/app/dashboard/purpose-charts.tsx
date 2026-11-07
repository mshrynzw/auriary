'use client';

import { useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  aggregatePurposeSpending,
  defaultPurposeChartMonthCount,
  isPurposeChartMonthCount,
  purposeBarRows,
  purposeChartMonthOptions,
  purposeSharePercent,
  type PurposeChartMonthCount,
  type PurposeChartPurpose,
  type PurposeChartTransaction,
} from '@/lib/bank-purpose-chart';

type PurposeChartsProps = {
  transactions: PurposeChartTransaction[];
  purposes: PurposeChartPurpose[];
};

const monthLabels: Record<PurposeChartMonthCount, string> = {
  1: '過去1か月',
  3: '過去3か月',
  6: '過去6か月',
  12: '過去12か月',
};

function yen(amount: number) {
  return `${amount.toLocaleString('ja-JP')}円`;
}

export function PurposeCharts({ transactions, purposes }: PurposeChartsProps) {
  const [monthCount, setMonthCount] = useState<PurposeChartMonthCount>(
    defaultPurposeChartMonthCount,
  );
  const chart = aggregatePurposeSpending(new Date(), monthCount, transactions, purposes);
  const rows = purposeBarRows(chart);

  return (
    <>
      <Card role="region" className="md:col-span-2" aria-label="用途の支出">
        <CardHeader>
          <CardTitle>用途の支出</CardTitle>
          <CardAction>
            <Select
              value={String(monthCount)}
              onValueChange={(value) => {
                const next = Number(value);
                if (isPurposeChartMonthCount(next)) setMonthCount(next);
              }}
            >
              <SelectTrigger className="w-[140px] cursor-pointer" aria-label="表示期間">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {purposeChartMonthOptions.map((option) => (
                  <SelectItem key={option} value={String(option)} className="cursor-pointer">
                    {monthLabels[option]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardAction>
        </CardHeader>
        <CardContent>
          {chart.series.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">この期間の支払がありません</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={rows}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis tickFormatter={(value) => Number(value).toLocaleString('ja-JP')} />
                <RechartsTooltip formatter={(value, name) => [yen(Number(value)), name]} />
                <Legend />
                {chart.series.map((item) => (
                  <Bar
                    key={item.key}
                    dataKey={item.key}
                    name={item.name}
                    fill={item.color}
                    maxBarSize={48}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card role="region" aria-label="用途の割合">
        <CardHeader>
          <CardTitle>用途の割合</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-[420px] space-y-4 overflow-y-auto">
            {chart.months.map((month) => (
              <div key={month.key}>
                <p className="text-center text-sm font-medium">{month.label}</p>
                {month.total === 0 ? (
                  <p className="py-4 text-center text-sm text-muted-foreground">支払なし</p>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={140}>
                      <PieChart>
                        <Pie
                          data={month.slices}
                          dataKey="amount"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={52}
                          stroke="none"
                        >
                          {month.slices.map((slice) => (
                            <Cell key={slice.key} fill={slice.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip
                          formatter={(value, name) => [
                            `${yen(Number(value))} (${purposeSharePercent(Number(value), month.total)}%)`,
                            name,
                          ]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <ul className="space-y-1 text-sm">
                      {month.slices.map((slice) => (
                        <li key={slice.key} style={{ color: slice.color }}>
                          {slice.name} {purposeSharePercent(slice.amount, month.total)}%
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
