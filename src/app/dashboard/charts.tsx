'use client';

import { useState, useEffect } from 'react';
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { endOfWeek, format, startOfWeek } from 'date-fns';
import { ja } from 'date-fns/locale';
import { type BankTransactionRow, type DiaryRow } from '@/schemas';

type ChartProps = {
  diaries: DiaryRow[];
  transactions: BankTransactionRow[];
};

type VisibilitySettings = {
  mood: boolean;
  sleepHours: boolean;
  sleepQuality: boolean;
  wakeLevel: boolean;
  daytimeLevel: boolean;
  preSleepLevel: boolean;
  medAdherenceLevel: boolean;
  appetiteLevel: boolean;
  sleepDesireLevel: boolean;
  exerciseLevel: boolean;
  odTimes: boolean;
  paymentTotal: boolean;
  depositTotal: boolean;
};

const STORAGE_KEY = 'dashboard-chart-visibility';
const PERIOD_STORAGE_KEY = 'dashboard-chart-period';
const DEFAULT_VISIBILITY: VisibilitySettings = {
  mood: true,
  sleepHours: true,
  sleepQuality: false,
  wakeLevel: false,
  daytimeLevel: false,
  preSleepLevel: false,
  medAdherenceLevel: false,
  appetiteLevel: false,
  sleepDesireLevel: false,
  exerciseLevel: false,
  odTimes: false,
  paymentTotal: true,
  depositTotal: true,
};

type ChartDataPoint = {
  date: Date;
  dateLabel: string;
  mood: number | null;
  sleepHours: number | null;
  sleepQuality: number | null;
  wakeLevel: number | null;
  daytimeLevel: number | null;
  preSleepLevel: number | null;
  medAdherenceLevel: number | null;
  appetiteLevel: number | null;
  sleepDesireLevel: number | null;
  exerciseLevel: number | null;
  odTimes: number | null;
  paymentTotal: number | null;
  depositTotal: number | null;
  paymentTotalDisplay?: number | null;
  depositTotalDisplay?: number | null;
};

const MONEY_CHART_MAX = 10000;

function averageFields(rows: ChartDataPoint[], date: Date, dateLabel: string): ChartDataPoint {
  const avgOf = (pick: (r: ChartDataPoint) => number | null) => {
    const vals = rows.map(pick).filter((v): v is number => v !== null && v !== undefined);
    if (vals.length === 0) return null;
    return Math.round((vals.reduce((s, v) => s + v, 0) / vals.length) * 10) / 10;
  };
  const sumOf = (pick: (r: ChartDataPoint) => number | null) => {
    const vals = rows.map(pick).filter((v): v is number => v !== null && v !== undefined);
    if (vals.length === 0) return null;
    return vals.reduce((s, v) => s + v, 0);
  };
  return {
    date,
    dateLabel,
    mood: avgOf((r) => r.mood),
    sleepHours: avgOf((r) => r.sleepHours),
    sleepQuality: avgOf((r) => r.sleepQuality),
    wakeLevel: avgOf((r) => r.wakeLevel),
    daytimeLevel: avgOf((r) => r.daytimeLevel),
    preSleepLevel: avgOf((r) => r.preSleepLevel),
    medAdherenceLevel: avgOf((r) => r.medAdherenceLevel),
    appetiteLevel: avgOf((r) => r.appetiteLevel),
    sleepDesireLevel: avgOf((r) => r.sleepDesireLevel),
    exerciseLevel: avgOf((r) => r.exerciseLevel),
    odTimes: avgOf((r) => r.odTimes),
    paymentTotal: sumOf((r) => r.paymentTotal),
    depositTotal: sumOf((r) => r.depositTotal),
  };
}

function aggregateToWeekly(daily: ChartDataPoint[]): ChartDataPoint[] {
  const groups = new Map<string, ChartDataPoint[]>();
  for (const row of daily) {
    const weekStart = startOfWeek(row.date, { weekStartsOn: 1 });
    const key = format(weekStart, 'yyyy-MM-dd');
    const list = groups.get(key) ?? [];
    list.push(row);
    groups.set(key, list);
  }

  const out: ChartDataPoint[] = [];
  for (const [, rows] of groups) {
    const first = rows[0].date;
    const weekStart = startOfWeek(first, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(first, { weekStartsOn: 1 });
    const dateLabel = `${format(weekStart, 'M/d', { locale: ja })}〜${format(weekEnd, 'M/d', { locale: ja })}`;
    out.push(averageFields(rows, weekStart, dateLabel));
  }
  out.sort((a, b) => a.date.getTime() - b.date.getTime());
  return out;
}

function aggregateToMonthly(daily: ChartDataPoint[]): ChartDataPoint[] {
  const groups = new Map<string, ChartDataPoint[]>();
  for (const row of daily) {
    const key = format(row.date, 'yyyy-MM');
    const list = groups.get(key) ?? [];
    list.push(row);
    groups.set(key, list);
  }

  const out: ChartDataPoint[] = [];
  for (const [ym, rows] of groups) {
    const [y, m] = ym.split('-').map(Number);
    const date = new Date(y, m - 1, 1);
    out.push(averageFields(rows, date, format(date, 'yyyy年M月', { locale: ja })));
  }
  out.sort((a, b) => a.date.getTime() - b.date.getTime());
  return out;
}

type GranularityOption = 'daily' | 'weekly' | 'monthly';
const GRANULARITY_STORAGE_KEY = 'dashboard-chart-granularity';
const GRANULARITY_OPTIONS: { value: GranularityOption; label: string }[] = [
  { value: 'daily', label: '日別' },
  { value: 'weekly', label: '週別の平均' },
  { value: 'monthly', label: '月別の平均' },
];

type PeriodOption = 'all' | '1week' | '2weeks' | '1month' | '3months' | '6months' | '1year';
const PERIOD_OPTIONS: { value: PeriodOption; label: string }[] = [
  { value: 'all', label: '全期間' },
  { value: '1week', label: '過去1週間' },
  { value: '2weeks', label: '過去2週間' },
  { value: '1month', label: '過去1ヶ月' },
  { value: '3months', label: '過去3ヶ月' },
  { value: '6months', label: '過去6ヶ月' },
  { value: '1year', label: '過去1年' },
];

type ChartHeaderControlsProps = {
  period: PeriodOption;
  granularity: GranularityOption;
  onPeriodChange: (value: PeriodOption) => void;
  onGranularityChange: (value: GranularityOption) => void;
  disabled?: boolean;
};

function ChartHeaderControls({
  period,
  granularity,
  onPeriodChange,
  onGranularityChange,
  disabled,
}: ChartHeaderControlsProps) {
  return (
    <>
      <CardTitle>データ推移</CardTitle>
      <CardAction className="flex flex-wrap items-center justify-end gap-3">
        <Select
          value={granularity}
          onValueChange={(v) => onGranularityChange(v as GranularityOption)}
          disabled={disabled}
        >
          <SelectTrigger className="w-[160px] cursor-pointer">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {GRANULARITY_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value} className="cursor-pointer">
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={period} onValueChange={onPeriodChange} disabled={disabled}>
          <SelectTrigger className="w-[140px] cursor-pointer">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PERIOD_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value} className="cursor-pointer">
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardAction>
    </>
  );
}

export function UnifiedChart({ diaries, transactions }: ChartProps) {
  const [visibility, setVisibility] = useState<VisibilitySettings>(DEFAULT_VISIBILITY);
  const [period, setPeriod] = useState<PeriodOption>('1month');
  const [granularity, setGranularity] = useState<GranularityOption>('daily');
  const [isMounted, setIsMounted] = useState(false);

  // ローカルストレージから設定を読み込み
  useEffect(() => {
    setIsMounted(true);
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setVisibility({ ...DEFAULT_VISIBILITY, ...parsed });
      } catch {
        // パースエラー時はデフォルト値を使用
      }
    }
    const savedPeriod = localStorage.getItem(PERIOD_STORAGE_KEY);
    if (savedPeriod && PERIOD_OPTIONS.some((opt) => opt.value === savedPeriod)) {
      setPeriod(savedPeriod as PeriodOption);
    }
    const savedGranularity = localStorage.getItem(GRANULARITY_STORAGE_KEY);
    if (savedGranularity && GRANULARITY_OPTIONS.some((opt) => opt.value === savedGranularity)) {
      setGranularity(savedGranularity as GranularityOption);
    }
  }, []);

  // 設定をローカルストレージに保存
  const updateVisibility = (key: keyof VisibilitySettings, value: boolean) => {
    const newVisibility = { ...visibility, [key]: value };
    setVisibility(newVisibility);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newVisibility));
  };

  // 期間を変更
  const handlePeriodChange = (value: PeriodOption) => {
    setPeriod(value);
    localStorage.setItem(PERIOD_STORAGE_KEY, value);
  };

  const handleGranularityChange = (value: GranularityOption) => {
    setGranularity(value);
    localStorage.setItem(GRANULARITY_STORAGE_KEY, value);
  };

  const getCutoffDate = () => {
    if (period === 'all') return null;
    const now = new Date();
    const cutoffDate = new Date();

    switch (period) {
      case '1week':
        cutoffDate.setDate(now.getDate() - 7);
        break;
      case '2weeks':
        cutoffDate.setDate(now.getDate() - 14);
        break;
      case '1month':
        cutoffDate.setMonth(now.getMonth() - 1);
        break;
      case '3months':
        cutoffDate.setMonth(now.getMonth() - 3);
        break;
      case '6months':
        cutoffDate.setMonth(now.getMonth() - 6);
        break;
      case '1year':
        cutoffDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    return cutoffDate;
  };
  // 睡眠時間を計算する関数（当日の就寝時間と起床時間を使用）
  const calculateSleepHours = (currentDiary: DiaryRow): number | null => {
    const sleepStart = currentDiary.sleep_start_at;
    const sleepEnd = currentDiary.sleep_end_at;

    // 就寝時間と起床時間の両方が必要
    if (!sleepStart || !sleepEnd) return null;

    const start = new Date(sleepStart);
    let end = new Date(sleepEnd);

    // 起床時刻が就寝時刻より前の場合（日付をまたいでいる）、起床時刻を翌日に調整
    if (end.getTime() < start.getTime()) {
      end.setDate(end.getDate() + 1);
    }

    // 日付をまたぐ場合を考慮（就寝が当日の夜、起床が翌朝の場合）
    const diffMs = end.getTime() - start.getTime();
    const hours = diffMs / (1000 * 60 * 60);

    // 負の値や異常に大きな値は除外（24時間を超える場合は除外）
    if (hours < 0 || hours > 24) return null;

    return Math.round(hours * 10) / 10; // 小数点第1位まで
  };

  // マウント前は期間フィルタを適用しないと、空データ判定とマウント後の表示が食い違い Select が消える原因になる
  if (!isMounted) {
    return (
      <Card className="border-none bg-muted/50">
        <CardHeader>
          <ChartHeaderControls
            period={period}
            granularity={granularity}
            onPeriodChange={handlePeriodChange}
            onGranularityChange={handleGranularityChange}
            disabled
          />
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">読み込み中...</div>
        </CardContent>
      </Card>
    );
  }

  const cutoffDate = getCutoffDate();
  const filteredDiaries = diaries.filter((d) => {
    if (!cutoffDate) return true;
    return new Date(d.journal_date) >= cutoffDate;
  });
  const filteredTransactions = transactions.filter((t) => {
    if (!cutoffDate) return true;
    return new Date(`${t.txn_date}T00:00:00`) >= cutoffDate;
  });

  // データを準備（日次）
  const dailyDiaryMap = new Map<string, Omit<ChartDataPoint, 'paymentTotal' | 'depositTotal'>>();
  filteredDiaries
    .map((d) => {
      const date = new Date(d.journal_date);
      // 当日の就寝時間と起床時間を使って計算
      const sleepHours = calculateSleepHours(d);
      // OD回数を計算（od_times配列の長さ）
      const odTimes = d.od_times && Array.isArray(d.od_times) ? d.od_times.length : null;

      return {
        date,
        dateLabel: format(date, 'M/d', { locale: ja }),
        mood: d.mood,
        sleepHours,
        sleepQuality: d.sleep_quality,
        wakeLevel: d.wake_level,
        daytimeLevel: d.daytime_level,
        preSleepLevel: d.pre_sleep_level,
        medAdherenceLevel: d.med_adherence_level,
        appetiteLevel: d.appetite_level,
        sleepDesireLevel: d.sleep_desire_level,
        exerciseLevel: d.exercise_level,
        odTimes,
      };
    })
    .forEach((d) => {
      const key = format(d.date, 'yyyy-MM-dd');
      dailyDiaryMap.set(key, d);
    });

  const dailyTransactionMap = new Map<
    string,
    { paymentTotal: number | null; depositTotal: number | null }
  >();
  for (const tx of filteredTransactions) {
    const key = tx.txn_date;
    const current = dailyTransactionMap.get(key) ?? { paymentTotal: null, depositTotal: null };
    if (tx.txn_type === '支払') {
      current.paymentTotal = (current.paymentTotal ?? 0) + tx.amount;
    } else if (tx.txn_type === '入金') {
      current.depositTotal = (current.depositTotal ?? 0) + tx.amount;
    }
    dailyTransactionMap.set(key, current);
  }

  const allDateKeys = new Set<string>([...dailyDiaryMap.keys(), ...dailyTransactionMap.keys()]);
  const chartData: ChartDataPoint[] = Array.from(allDateKeys)
    .sort()
    .map((dateKey) => {
      const diary = dailyDiaryMap.get(dateKey);
      const tx = dailyTransactionMap.get(dateKey);
      const date = new Date(`${dateKey}T00:00:00`);

      return {
        date,
        dateLabel: format(date, 'M/d', { locale: ja }),
        mood: diary?.mood ?? null,
        sleepHours: diary?.sleepHours ?? null,
        sleepQuality: diary?.sleepQuality ?? null,
        wakeLevel: diary?.wakeLevel ?? null,
        daytimeLevel: diary?.daytimeLevel ?? null,
        preSleepLevel: diary?.preSleepLevel ?? null,
        medAdherenceLevel: diary?.medAdherenceLevel ?? null,
        appetiteLevel: diary?.appetiteLevel ?? null,
        sleepDesireLevel: diary?.sleepDesireLevel ?? null,
        exerciseLevel: diary?.exerciseLevel ?? null,
        odTimes: diary?.odTimes ?? null,
        paymentTotal: tx?.paymentTotal ?? null,
        depositTotal: tx?.depositTotal ?? null,
      };
    })
    .filter(
      (d) =>
        d.mood !== null ||
        d.sleepHours !== null ||
        d.sleepQuality !== null ||
        d.wakeLevel !== null ||
        d.daytimeLevel !== null ||
        d.preSleepLevel !== null ||
        d.medAdherenceLevel !== null ||
        d.appetiteLevel !== null ||
        d.sleepDesireLevel !== null ||
        d.exerciseLevel !== null ||
        d.odTimes !== null ||
        d.paymentTotal !== null ||
        d.depositTotal !== null,
    );

  const displayData =
    granularity === 'monthly'
      ? aggregateToMonthly(chartData)
      : granularity === 'weekly'
        ? aggregateToWeekly(chartData)
        : chartData;

  const clippedDisplayData = displayData.map((d) => ({
    ...d,
    paymentTotalDisplay: d.paymentTotal === null ? null : Math.min(d.paymentTotal, MONEY_CHART_MAX),
    depositTotalDisplay: d.depositTotal === null ? null : Math.min(d.depositTotal, MONEY_CHART_MAX),
  }));

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <ChartHeaderControls
            period={period}
            granularity={granularity}
            onPeriodChange={handlePeriodChange}
            onGranularityChange={handleGranularityChange}
          />
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">データがありません</div>
        </CardContent>
      </Card>
    );
  }

  // 睡眠時間の最大値を取得（Y軸の範囲設定用）
  const maxSleepHours = Math.max(
    ...clippedDisplayData.map((d) => d.sleepHours || 0).filter((h) => h > 0),
  );
  const sleepYAxisMax = maxSleepHours > 0 ? Math.ceil(maxSleepHours / 2) * 2 + 2 : 12; // 2時間刻みで設定

  const colors = {
    mood: '#3b82f6', // 青
    sleepHours: '#3b82f6', // 青
    sleepHoursBar: 'rgba(59, 130, 246, 0.3)', // 青（薄い、棒グラフ用）
    sleepQuality: '#8b5cf6', // 紫
    wakeLevel: '#f59e0b', // オレンジ
    daytimeLevel: '#22c55e', // 緑
    preSleepLevel: '#ec4899', // ピンク
    medAdherenceLevel: '#10b981', // 緑
    appetiteLevel: '#ef4444', // 赤
    sleepDesireLevel: '#06b6d4', // シアン
    exerciseLevel: '#14b8a6', // ティール
    odTimes: '#dc2626', // 赤（OD回数用）
    odTimesBar: 'rgba(220, 38, 38, 0.3)', // 赤（薄い、棒グラフ用）
    paymentTotal: '#ad975a',
    paymentTotalBar: 'rgba(234, 179, 8, 0.10)',
    depositTotal: '#06b6d4',
    depositTotalBar: 'rgba(6, 182, 212, 0.10)',
  };

  return (
    <Card className="border-none bg-muted/80">
      <CardHeader>
        <ChartHeaderControls
          period={period}
          granularity={granularity}
          onPeriodChange={handlePeriodChange}
          onGranularityChange={handleGranularityChange}
        />
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart
            data={clippedDisplayData}
            margin={{ top: 5, right: 30, left: 0, bottom: 60 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.129 0.042 264.695)" />
            <XAxis
              dataKey="dateLabel"
              tick={{ fontSize: 12, fill: 'oklch(0.129 0.042 264.695)' }}
              stroke="oklch(0.129 0.042 264.695)"
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis
              yAxisId="left"
              domain={[0, sleepYAxisMax]}
              ticks={[0, 8, 16]}
              tick={{ fontSize: 12, fill: 'oklch(0.129 0.042 264.695)' }}
              stroke="oklch(0.129 0.042 264.695)"
              label={{
                value: '睡眠時間 （時間）',
                angle: -90,
                position: 'left',
                offset: -7.5,
                fill: 'oklch(0.129 0.042 264.695)',
                style: {
                  textAnchor: 'middle',
                },
              }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              domain={[0, 10]}
              ticks={[0, 5, 10]}
              tick={{ fontSize: 12, fill: 'oklch(0.129 0.042 264.695)' }}
              stroke="oklch(0.129 0.042 264.695)"
              label={{
                value: 'スコア',
                angle: 90,
                position: 'right',
                offset: -7.5,
                fill: 'oklch(0.129 0.042 264.695)',
                style: {
                  textAnchor: 'middle',
                },
              }}
            />
            <YAxis yAxisId="money" hide domain={[0, MONEY_CHART_MAX]} />
            <RechartsTooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="rounded-lg border  p-2 shadow-sm">
                      <div className="grid gap-2">
                        <div className="flex flex-col">
                          <span
                            className="text-[0.70rem] uppercase"
                            style={{ color: 'oklch(0.129 0.042 264.695)' }}
                          >
                            {granularity === 'daily' ? '日付' : '期間'}
                          </span>
                          <span className="font-bold">
                            {granularity === 'daily'
                              ? format(data.date, 'yyyy年M月d日 (E)', { locale: ja })
                              : granularity === 'monthly'
                                ? format(data.date, 'yyyy年M月', { locale: ja })
                                : (() => {
                                    const ws = startOfWeek(data.date, { weekStartsOn: 1 });
                                    const we = endOfWeek(data.date, { weekStartsOn: 1 });
                                    return `${format(ws, 'yyyy年M月d日', { locale: ja })}〜${format(we, 'yyyy年M月d日 (E)', { locale: ja })}`;
                                  })()}
                          </span>
                        </div>
                        {payload.map((entry, index) => {
                          if (!entry.value && entry.value !== 0) return null;
                          const isLevel =
                            entry.dataKey?.toString().includes('Level') ||
                            entry.dataKey?.toString() === 'sleepQuality';
                          const isOdTimes = entry.dataKey?.toString() === 'odTimes';
                          const isMoney =
                            entry.dataKey?.toString() === 'paymentTotalDisplay' ||
                            entry.dataKey?.toString() === 'depositTotalDisplay';
                          const rawMoneyValue =
                            entry.dataKey?.toString() === 'paymentTotalDisplay'
                              ? data.paymentTotal
                              : entry.dataKey?.toString() === 'depositTotalDisplay'
                                ? data.depositTotal
                                : null;
                          return (
                            <div key={index} className="flex flex-col font-bold">
                              <span
                                className="text-[0.70rem] uppercase"
                                style={{ color: 'oklch(0.129 0.042 264.695)' }}
                              >
                                {entry.name}
                              </span>
                              <span>
                                {isLevel
                                  ? `${entry.value}/10`
                                  : isMoney
                                    ? `${Number(rawMoneyValue ?? entry.value).toLocaleString('ja-JP')}円`
                                    : entry.dataKey === 'sleepHours'
                                      ? `${entry.value}時間`
                                      : isOdTimes
                                        ? `${entry.value}回`
                                        : `${entry.value}/10`}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend />
            {/* 睡眠時間（棒グラフ） */}
            {visibility.sleepHours && (
              <Bar
                yAxisId="left"
                dataKey="sleepHours"
                fill={colors.sleepHoursBar}
                stroke={colors.sleepHours}
                strokeWidth={1}
                name="睡眠時間"
                radius={[4, 4, 0, 0]}
              />
            )}
            {visibility.paymentTotal && (
              <Bar
                yAxisId="money"
                dataKey="paymentTotalDisplay"
                fill={colors.paymentTotalBar}
                stroke={colors.paymentTotal}
                strokeWidth={1}
                name="支払（合計）"
                barSize={8}
              />
            )}
            {visibility.depositTotal && (
              <Bar
                yAxisId="money"
                dataKey="depositTotalDisplay"
                fill={colors.depositTotalBar}
                stroke={colors.depositTotal}
                strokeWidth={1}
                name="入金（合計）"
                barSize={8}
              />
            )}
            {/* 感情スコア（AI分析）（折れ線） */}
            {visibility.mood && (
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="mood"
                stroke={colors.mood}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6 }}
                name="感情スコア（AI分析）"
              />
            )}
            {/* 7項目（折れ線） */}
            {visibility.sleepQuality && (
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="sleepQuality"
                stroke={colors.sleepQuality}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6 }}
                name="睡眠の質"
              />
            )}
            {visibility.wakeLevel && (
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="wakeLevel"
                stroke={colors.wakeLevel}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6 }}
                name="起床時の気分"
              />
            )}
            {visibility.daytimeLevel && (
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="daytimeLevel"
                stroke={colors.daytimeLevel}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6 }}
                name="日中の気分"
              />
            )}
            {visibility.preSleepLevel && (
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="preSleepLevel"
                stroke={colors.preSleepLevel}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6 }}
                name="就寝前の気分"
              />
            )}
            {visibility.medAdherenceLevel && (
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="medAdherenceLevel"
                stroke={colors.medAdherenceLevel}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6 }}
                name="服薬遵守度"
              />
            )}
            {visibility.appetiteLevel && (
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="appetiteLevel"
                stroke={colors.appetiteLevel}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6 }}
                name="食欲レベル"
              />
            )}
            {visibility.sleepDesireLevel && (
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="sleepDesireLevel"
                stroke={colors.sleepDesireLevel}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6 }}
                name="睡眠欲レベル"
              />
            )}
            {visibility.exerciseLevel && (
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="exerciseLevel"
                stroke={colors.exerciseLevel}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6 }}
                name="運動レベル"
              />
            )}
            {/* OD回数（棒グラフ） */}
            {visibility.odTimes && (
              <Bar
                yAxisId="right"
                dataKey="odTimes"
                fill={colors.odTimesBar}
                stroke={colors.odTimes}
                strokeWidth={1}
                name="OD回数"
                radius={[4, 4, 0, 0]}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
        {/* 表示設定コントロール */}
        <div className="mb-4 p-4 border rounded-lg bg-muted/50">
          <div className="text-sm font-medium mb-3">表示項目</div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="mood"
                checked={visibility.mood}
                onCheckedChange={(checked) => updateVisibility('mood', checked === true)}
              />
              <Label htmlFor="mood" className="text-sm cursor-pointer">
                感情スコア（AI分析）
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="sleepHours"
                checked={visibility.sleepHours}
                onCheckedChange={(checked) => updateVisibility('sleepHours', checked === true)}
              />
              <Label htmlFor="sleepHours" className="text-sm cursor-pointer">
                睡眠時間
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="sleepQuality"
                checked={visibility.sleepQuality}
                onCheckedChange={(checked) => updateVisibility('sleepQuality', checked === true)}
              />
              <Label htmlFor="sleepQuality" className="text-sm cursor-pointer">
                睡眠の質
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="wakeLevel"
                checked={visibility.wakeLevel}
                onCheckedChange={(checked) => updateVisibility('wakeLevel', checked === true)}
              />
              <Label htmlFor="wakeLevel" className="text-sm cursor-pointer">
                起床時の気分
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="daytimeLevel"
                checked={visibility.daytimeLevel}
                onCheckedChange={(checked) => updateVisibility('daytimeLevel', checked === true)}
              />
              <Label htmlFor="daytimeLevel" className="text-sm cursor-pointer">
                日中の気分
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="preSleepLevel"
                checked={visibility.preSleepLevel}
                onCheckedChange={(checked) => updateVisibility('preSleepLevel', checked === true)}
              />
              <Label htmlFor="preSleepLevel" className="text-sm cursor-pointer">
                就寝前の気分
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="medAdherenceLevel"
                checked={visibility.medAdherenceLevel}
                onCheckedChange={(checked) =>
                  updateVisibility('medAdherenceLevel', checked === true)
                }
              />
              <Label htmlFor="medAdherenceLevel" className="text-sm cursor-pointer">
                服薬遵守度
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="appetiteLevel"
                checked={visibility.appetiteLevel}
                onCheckedChange={(checked) => updateVisibility('appetiteLevel', checked === true)}
              />
              <Label htmlFor="appetiteLevel" className="text-sm cursor-pointer">
                食欲レベル
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="sleepDesireLevel"
                checked={visibility.sleepDesireLevel}
                onCheckedChange={(checked) =>
                  updateVisibility('sleepDesireLevel', checked === true)
                }
              />
              <Label htmlFor="sleepDesireLevel" className="text-sm cursor-pointer">
                睡眠欲レベル
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="exerciseLevel"
                checked={visibility.exerciseLevel}
                onCheckedChange={(checked) => updateVisibility('exerciseLevel', checked === true)}
              />
              <Label htmlFor="exerciseLevel" className="text-sm cursor-pointer">
                運動レベル
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="odTimes"
                checked={visibility.odTimes}
                onCheckedChange={(checked) => updateVisibility('odTimes', checked === true)}
              />
              <Label htmlFor="odTimes" className="text-sm cursor-pointer">
                OD回数
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="paymentTotal"
                checked={visibility.paymentTotal}
                onCheckedChange={(checked) => updateVisibility('paymentTotal', checked === true)}
              />
              <Label htmlFor="paymentTotal" className="text-sm cursor-pointer">
                支払（合計）
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="depositTotal"
                checked={visibility.depositTotal}
                onCheckedChange={(checked) => updateVisibility('depositTotal', checked === true)}
              />
              <Label htmlFor="depositTotal" className="text-sm cursor-pointer">
                入金（合計）
              </Label>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// 後方互換性のため、古いコンポーネント名もエクスポート
export const MoodChart = UnifiedChart;
export const LevelChart = UnifiedChart;
