'use client';

import { useEffect, useState } from 'react';
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
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { endOfWeek, format, startOfWeek } from 'date-fns';
import { ja } from 'date-fns/locale';
import { type DiaryRow } from '@/schemas';

type BloodPressureChartsProps = {
  diaries: DiaryRow[];
};

type DiarySeriesKey =
  | 'sleepQuality'
  | 'wakeLevel'
  | 'daytimeLevel'
  | 'preSleepLevel'
  | 'medAdherenceLevel'
  | 'appetiteLevel'
  | 'sleepDesireLevel'
  | 'exerciseLevel'
  | 'odTimes'
  | 'alcoholTimes';

type VisibilitySettings = Record<DiarySeriesKey, boolean>;

type ChartDataPoint = {
  date: Date;
  dateLabel: string;
  systolic: number | null;
  diastolic: number | null;
  pulse: number | null;
} & Record<DiarySeriesKey, number | null>;

type GranularityOption = 'daily' | 'weekly' | 'monthly';
type PeriodOption = 'all' | '1week' | '2weeks' | '1month' | '3months' | '6months' | '1year';

const BP_VISIBILITY_STORAGE_KEY = 'blood-pressure-chart-visibility-bp';
const PULSE_VISIBILITY_STORAGE_KEY = 'blood-pressure-chart-visibility-pulse';
const LEGACY_VISIBILITY_STORAGE_KEY = 'blood-pressure-chart-visibility';
const PERIOD_STORAGE_KEY = 'blood-pressure-chart-period';
const GRANULARITY_STORAGE_KEY = 'blood-pressure-chart-granularity';

const DEFAULT_VISIBILITY: VisibilitySettings = {
  sleepQuality: true,
  wakeLevel: true,
  daytimeLevel: true,
  preSleepLevel: true,
  medAdherenceLevel: true,
  appetiteLevel: true,
  sleepDesireLevel: true,
  exerciseLevel: true,
  odTimes: true,
  alcoholTimes: true,
};

const GRANULARITY_OPTIONS: { value: GranularityOption; label: string }[] = [
  { value: 'daily', label: '日別' },
  { value: 'weekly', label: '週別の平均' },
  { value: 'monthly', label: '月別の平均' },
];

const PERIOD_OPTIONS: { value: PeriodOption; label: string }[] = [
  { value: 'all', label: '全期間' },
  { value: '1week', label: '過去1週間' },
  { value: '2weeks', label: '過去2週間' },
  { value: '1month', label: '過去1ヶ月' },
  { value: '3months', label: '過去3ヶ月' },
  { value: '6months', label: '過去6ヶ月' },
  { value: '1year', label: '過去1年' },
];

const DIARY_SERIES: {
  key: DiarySeriesKey;
  name: string;
  color: string;
  barColor?: string;
  kind: 'line' | 'bar';
}[] = [
  { key: 'sleepQuality', name: '睡眠の質', color: '#8b5cf6', kind: 'line' },
  { key: 'wakeLevel', name: '起床時の気分', color: '#f59e0b', kind: 'line' },
  { key: 'daytimeLevel', name: '日中の気分', color: '#22c55e', kind: 'line' },
  { key: 'preSleepLevel', name: '就寝前の気分', color: '#ec4899', kind: 'line' },
  { key: 'medAdherenceLevel', name: '服薬遵守度', color: '#10b981', kind: 'line' },
  { key: 'appetiteLevel', name: '食欲レベル', color: '#ef4444', kind: 'line' },
  { key: 'sleepDesireLevel', name: '睡眠欲レベル', color: '#06b6d4', kind: 'line' },
  { key: 'exerciseLevel', name: '運動レベル', color: '#14b8a6', kind: 'line' },
  {
    key: 'odTimes',
    name: 'OD回数',
    color: '#dc2626',
    barColor: 'rgba(220, 38, 38, 0.3)',
    kind: 'bar',
  },
  {
    key: 'alcoholTimes',
    name: 'アルコール摂取回数',
    color: '#331c02',
    barColor: 'rgba(74, 44, 1, 0.3)',
    kind: 'bar',
  },
];

const COLORS = {
  systolic: '#dc2626',
  diastolic: '#2563eb',
  pulse: '#ca8a04',
};

const NORMAL_RANGE = {
  systolic: { min: 90, max: 120, unit: 'mmHg', label: '収縮期血圧' },
  diastolic: { min: 60, max: 80, unit: 'mmHg', label: '拡張期血圧' },
  pulse: { min: 60, max: 100, unit: 'bpm', label: '脈拍' },
} as const;

type NormalRangeKey = keyof typeof NORMAL_RANGE;

const AXIS_TICK = { fontSize: 12, fill: 'oklch(0.129 0.042 264.695)' };
const AXIS_STROKE = 'oklch(0.129 0.042 264.695)';

function averageFields(rows: ChartDataPoint[], date: Date, dateLabel: string): ChartDataPoint {
  const avgOf = (pick: (r: ChartDataPoint) => number | null) => {
    const vals = rows.map(pick).filter((v): v is number => v !== null && v !== undefined);
    if (vals.length === 0) return null;
    return Math.round((vals.reduce((s, v) => s + v, 0) / vals.length) * 10) / 10;
  };

  return {
    date,
    dateLabel,
    systolic: avgOf((r) => r.systolic),
    diastolic: avgOf((r) => r.diastolic),
    pulse: avgOf((r) => r.pulse),
    sleepQuality: avgOf((r) => r.sleepQuality),
    wakeLevel: avgOf((r) => r.wakeLevel),
    daytimeLevel: avgOf((r) => r.daytimeLevel),
    preSleepLevel: avgOf((r) => r.preSleepLevel),
    medAdherenceLevel: avgOf((r) => r.medAdherenceLevel),
    appetiteLevel: avgOf((r) => r.appetiteLevel),
    sleepDesireLevel: avgOf((r) => r.sleepDesireLevel),
    exerciseLevel: avgOf((r) => r.exerciseLevel),
    odTimes: avgOf((r) => r.odTimes),
    alcoholTimes: avgOf((r) => r.alcoholTimes),
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

function getCutoffDate(period: PeriodOption): Date | null {
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
}

function ChartPeriodControls({
  period,
  granularity,
  onPeriodChange,
  onGranularityChange,
  disabled,
}: {
  period: PeriodOption;
  granularity: GranularityOption;
  onPeriodChange: (value: PeriodOption) => void;
  onGranularityChange: (value: GranularityOption) => void;
  disabled?: boolean;
}) {
  return (
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
  );
}

function ChartTooltip({
  active,
  payload,
  granularity,
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number | string | null; dataKey?: string | number }>;
  granularity: GranularityOption;
}) {
  if (!active || !payload || payload.length === 0) return null;
  const data = payload[0] as { payload: ChartDataPoint };
  const point = data.payload;

  return (
    <div className="rounded-lg border p-2 shadow-sm bg-background">
      <div className="grid gap-2">
        <div className="flex flex-col">
          <span className="text-[0.70rem] uppercase" style={{ color: AXIS_STROKE }}>
            {granularity === 'daily' ? '日付' : '期間'}
          </span>
          <span className="font-bold">
            {granularity === 'daily'
              ? format(point.date, 'yyyy年M月d日 (E)', { locale: ja })
              : granularity === 'monthly'
                ? format(point.date, 'yyyy年M月', { locale: ja })
                : (() => {
                    const ws = startOfWeek(point.date, { weekStartsOn: 1 });
                    const we = endOfWeek(point.date, { weekStartsOn: 1 });
                    return `${format(ws, 'yyyy年M月d日', { locale: ja })}〜${format(we, 'yyyy年M月d日 (E)', { locale: ja })}`;
                  })()}
          </span>
        </div>
        {payload.map((entry, index) => {
          if (entry.value === null || entry.value === undefined || entry.value === '') return null;
          const key = entry.dataKey?.toString() ?? '';
          const isLevel = key.includes('Level') || key === 'sleepQuality';
          const isCount = key === 'odTimes' || key === 'alcoholTimes';
          const isBp = key === 'systolic' || key === 'diastolic';
          const isPulse = key === 'pulse';
          return (
            <div key={index} className="flex flex-col font-bold">
              <span className="text-[0.70rem] uppercase" style={{ color: AXIS_STROKE }}>
                {entry.name}
              </span>
              <span>
                {isLevel
                  ? `${entry.value}/10`
                  : isCount
                    ? `${entry.value}回`
                    : isBp
                      ? `${entry.value} mmHg`
                      : isPulse
                        ? `${entry.value} bpm`
                        : entry.value}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function axisLabel(value: string, side: 'left' | 'right') {
  return {
    value,
    angle: side === 'left' ? -90 : 90,
    position: side,
    offset: -7.5,
    fill: AXIS_STROKE,
    style: { textAnchor: 'middle' as const },
  };
}

function renderNormalRangeLines(
  keys: NormalRangeKey[],
  axisByKey: Partial<Record<NormalRangeKey, 'left' | 'right'>>,
) {
  return keys.flatMap((key) => {
    const range = NORMAL_RANGE[key];
    const color = COLORS[key];
    const yAxisId = axisByKey[key] ?? 'left';
    return [
      <ReferenceLine
        key={`${key}-min`}
        yAxisId={yAxisId}
        y={range.min}
        stroke={color}
        strokeDasharray="6 4"
        strokeWidth={1}
        strokeOpacity={0.35}
        label={{
          value: String(range.min),
          position: 'insideRight',
          fill: color,
          fontSize: 10,
          opacity: 0.45,
        }}
      />,
      <ReferenceLine
        key={`${key}-max`}
        yAxisId={yAxisId}
        y={range.max}
        stroke={color}
        strokeDasharray="6 4"
        strokeWidth={1}
        strokeOpacity={0.35}
        label={{
          value: String(range.max),
          position: 'insideRight',
          fill: color,
          fontSize: 10,
          opacity: 0.45,
        }}
      />,
    ];
  });
}

function NormalRangeNote({ keys }: { keys: NormalRangeKey[] }) {
  const text = keys
    .map((key) => {
      const range = NORMAL_RANGE[key];
      return `${range.label} ${range.min}–${range.max} ${range.unit}`;
    })
    .join('、');
  return <p className="text-xs text-muted-foreground mt-2">破線は正常範囲（{text}）</p>;
}

function renderDiarySeries(visibility: VisibilitySettings) {
  return DIARY_SERIES.map((series) => {
    if (!visibility[series.key]) return null;
    if (series.kind === 'bar') {
      return (
        <Bar
          key={series.key}
          yAxisId="right"
          dataKey={series.key}
          fill={series.barColor}
          stroke={series.color}
          strokeWidth={1}
          name={series.name}
          radius={[4, 4, 0, 0]}
        />
      );
    }
    return (
      <Line
        key={series.key}
        yAxisId="right"
        type="monotone"
        dataKey={series.key}
        stroke={series.color}
        strokeWidth={2}
        dot={false}
        activeDot={{ r: 6 }}
        name={series.name}
      />
    );
  });
}

export function BloodPressureCharts({ diaries }: BloodPressureChartsProps) {
  const [bpVisibility, setBpVisibility] = useState<VisibilitySettings>(DEFAULT_VISIBILITY);
  const [pulseVisibility, setPulseVisibility] = useState<VisibilitySettings>(DEFAULT_VISIBILITY);
  const [period, setPeriod] = useState<PeriodOption>('1month');
  const [granularity, setGranularity] = useState<GranularityOption>('daily');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    const loadVisibility = (key: string): VisibilitySettings | null => {
      const saved = localStorage.getItem(key);
      if (!saved) return null;
      try {
        return { ...DEFAULT_VISIBILITY, ...JSON.parse(saved) };
      } catch {
        return null;
      }
    };

    const legacyVisibility = loadVisibility(LEGACY_VISIBILITY_STORAGE_KEY);
    setBpVisibility(
      loadVisibility(BP_VISIBILITY_STORAGE_KEY) ?? legacyVisibility ?? DEFAULT_VISIBILITY,
    );
    setPulseVisibility(
      loadVisibility(PULSE_VISIBILITY_STORAGE_KEY) ?? legacyVisibility ?? DEFAULT_VISIBILITY,
    );

    const savedPeriod = localStorage.getItem(PERIOD_STORAGE_KEY);
    if (savedPeriod && PERIOD_OPTIONS.some((opt) => opt.value === savedPeriod)) {
      setPeriod(savedPeriod as PeriodOption);
    }
    const savedGranularity = localStorage.getItem(GRANULARITY_STORAGE_KEY);
    if (savedGranularity && GRANULARITY_OPTIONS.some((opt) => opt.value === savedGranularity)) {
      setGranularity(savedGranularity as GranularityOption);
    }
  }, []);

  const updateBpVisibility = (key: DiarySeriesKey, value: boolean) => {
    const next = { ...bpVisibility, [key]: value };
    setBpVisibility(next);
    localStorage.setItem(BP_VISIBILITY_STORAGE_KEY, JSON.stringify(next));
  };

  const updatePulseVisibility = (key: DiarySeriesKey, value: boolean) => {
    const next = { ...pulseVisibility, [key]: value };
    setPulseVisibility(next);
    localStorage.setItem(PULSE_VISIBILITY_STORAGE_KEY, JSON.stringify(next));
  };

  const handlePeriodChange = (value: PeriodOption) => {
    setPeriod(value);
    localStorage.setItem(PERIOD_STORAGE_KEY, value);
  };

  const handleGranularityChange = (value: GranularityOption) => {
    setGranularity(value);
    localStorage.setItem(GRANULARITY_STORAGE_KEY, value);
  };

  if (!isMounted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>血圧</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">読み込み中...</div>
        </CardContent>
      </Card>
    );
  }

  const cutoffDate = getCutoffDate(period);
  const filteredDiaries = diaries.filter((d) => {
    if (!cutoffDate) return true;
    return new Date(d.journal_date) >= cutoffDate;
  });

  const chartData: ChartDataPoint[] = filteredDiaries
    .map((d) => {
      const date = new Date(d.journal_date);
      const odTimes = d.od_times && Array.isArray(d.od_times) ? d.od_times.length : null;
      const alcoholTimes =
        d.alcohol_times && Array.isArray(d.alcohol_times) ? d.alcohol_times.length : null;

      return {
        date,
        dateLabel: format(date, 'M/d', { locale: ja }),
        systolic: d.systolic ?? null,
        diastolic: d.diastolic ?? null,
        pulse: d.pulse ?? null,
        sleepQuality: d.sleep_quality,
        wakeLevel: d.wake_level,
        daytimeLevel: d.daytime_level,
        preSleepLevel: d.pre_sleep_level,
        medAdherenceLevel: d.med_adherence_level,
        appetiteLevel: d.appetite_level,
        sleepDesireLevel: d.sleep_desire_level,
        exerciseLevel: d.exercise_level,
        odTimes,
        alcoholTimes,
      };
    })
    .filter(
      (d) =>
        d.systolic !== null ||
        d.diastolic !== null ||
        d.pulse !== null ||
        d.sleepQuality !== null ||
        d.wakeLevel !== null ||
        d.daytimeLevel !== null ||
        d.preSleepLevel !== null ||
        d.medAdherenceLevel !== null ||
        d.appetiteLevel !== null ||
        d.sleepDesireLevel !== null ||
        d.exerciseLevel !== null ||
        d.odTimes !== null ||
        d.alcoholTimes !== null,
    )
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  const displayData =
    granularity === 'monthly'
      ? aggregateToMonthly(chartData)
      : granularity === 'weekly'
        ? aggregateToWeekly(chartData)
        : chartData;

  const periodControls = (
    <ChartPeriodControls
      period={period}
      granularity={granularity}
      onPeriodChange={handlePeriodChange}
      onGranularityChange={handleGranularityChange}
    />
  );

  if (chartData.length === 0) {
    return (
      <Card className="border-none bg-muted/80">
        <CardHeader>
          <CardTitle>血圧</CardTitle>
          {periodControls}
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">データがありません</div>
        </CardContent>
      </Card>
    );
  }

  const renderVisibilityCheckboxes = (
    idPrefix: string,
    settings: VisibilitySettings,
    onChange: (key: DiarySeriesKey, value: boolean) => void,
  ) => (
    <div className="p-4 border rounded-lg bg-muted/50">
      <div className="text-sm font-medium mb-3">日記指標の表示</div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {DIARY_SERIES.map((series) => (
          <div key={series.key} className="flex items-center space-x-2">
            <Checkbox
              id={`${idPrefix}-${series.key}`}
              checked={settings[series.key]}
              onCheckedChange={(checked) => onChange(series.key, checked === true)}
            />
            <Label htmlFor={`${idPrefix}-${series.key}`} className="text-sm cursor-pointer">
              {series.name}
            </Label>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <Card className="border-none bg-muted/80">
        <CardHeader>
          <CardTitle>血圧と脈拍</CardTitle>
          {periodControls}
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={displayData} margin={{ top: 5, right: 30, left: 0, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={AXIS_STROKE} />
              <XAxis
                dataKey="dateLabel"
                tick={AXIS_TICK}
                stroke={AXIS_STROKE}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis
                yAxisId="left"
                domain={[40, 200]}
                tick={AXIS_TICK}
                stroke={AXIS_STROKE}
                label={axisLabel('血圧 (mmHg)', 'left')}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                domain={[40, 140]}
                tick={AXIS_TICK}
                stroke={AXIS_STROKE}
                label={axisLabel('脈拍 (bpm)', 'right')}
              />
              <RechartsTooltip content={<ChartTooltip granularity={granularity} />} />
              <Legend />
              {renderNormalRangeLines(['systolic', 'diastolic', 'pulse'], {
                systolic: 'left',
                diastolic: 'left',
                pulse: 'right',
              })}
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="systolic"
                stroke={COLORS.systolic}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6 }}
                name="収縮期血圧"
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="diastolic"
                stroke={COLORS.diastolic}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6 }}
                name="拡張期血圧"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="pulse"
                stroke={COLORS.pulse}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6 }}
                name="脈拍"
              />
            </ComposedChart>
          </ResponsiveContainer>
          <NormalRangeNote keys={['systolic', 'diastolic', 'pulse']} />
        </CardContent>
      </Card>

      <Card className="border-none bg-muted/80">
        <CardHeader>
          <CardTitle>血圧と日記指標</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={displayData} margin={{ top: 5, right: 30, left: 0, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={AXIS_STROKE} />
              <XAxis
                dataKey="dateLabel"
                tick={AXIS_TICK}
                stroke={AXIS_STROKE}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis
                yAxisId="left"
                domain={[40, 200]}
                tick={AXIS_TICK}
                stroke={AXIS_STROKE}
                label={axisLabel('血圧 (mmHg)', 'left')}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                domain={[0, 10]}
                ticks={[0, 5, 10]}
                tick={AXIS_TICK}
                stroke={AXIS_STROKE}
                label={axisLabel('スコア', 'right')}
              />
              <RechartsTooltip content={<ChartTooltip granularity={granularity} />} />
              <Legend />
              {renderNormalRangeLines(['systolic', 'diastolic'], {
                systolic: 'left',
                diastolic: 'left',
              })}
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="systolic"
                stroke={COLORS.systolic}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6 }}
                name="収縮期血圧"
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="diastolic"
                stroke={COLORS.diastolic}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6 }}
                name="拡張期血圧"
              />
              {renderDiarySeries(bpVisibility)}
            </ComposedChart>
          </ResponsiveContainer>
          <NormalRangeNote keys={['systolic', 'diastolic']} />
          {renderVisibilityCheckboxes('bp-diary', bpVisibility, updateBpVisibility)}
        </CardContent>
      </Card>

      <Card className="border-none bg-muted/80">
        <CardHeader>
          <CardTitle>脈拍と日記指標</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={displayData} margin={{ top: 5, right: 30, left: 0, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={AXIS_STROKE} />
              <XAxis
                dataKey="dateLabel"
                tick={AXIS_TICK}
                stroke={AXIS_STROKE}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis
                yAxisId="left"
                domain={[40, 140]}
                tick={AXIS_TICK}
                stroke={AXIS_STROKE}
                label={axisLabel('脈拍 (bpm)', 'left')}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                domain={[0, 10]}
                ticks={[0, 5, 10]}
                tick={AXIS_TICK}
                stroke={AXIS_STROKE}
                label={axisLabel('スコア', 'right')}
              />
              <RechartsTooltip content={<ChartTooltip granularity={granularity} />} />
              <Legend />
              {renderNormalRangeLines(['pulse'], { pulse: 'left' })}
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="pulse"
                stroke={COLORS.pulse}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6 }}
                name="脈拍"
              />
              {renderDiarySeries(pulseVisibility)}
            </ComposedChart>
          </ResponsiveContainer>
          <NormalRangeNote keys={['pulse']} />
          {renderVisibilityCheckboxes('pulse-diary', pulseVisibility, updatePulseVisibility)}
        </CardContent>
      </Card>
    </div>
  );
}
