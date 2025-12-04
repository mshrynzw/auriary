'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { type DiaryRow } from '@/schemas';

type ChartProps = {
  diaries: DiaryRow[];
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
};

type PeriodOption = 'all' | '1month' | '3months' | '6months' | '1year';
const PERIOD_OPTIONS: { value: PeriodOption; label: string }[] = [
  { value: 'all', label: '全期間' },
  { value: '1month', label: '過去1ヶ月' },
  { value: '3months', label: '過去3ヶ月' },
  { value: '6months', label: '過去6ヶ月' },
  { value: '1year', label: '過去1年' },
];

export function UnifiedChart({ diaries }: ChartProps) {
  const [visibility, setVisibility] = useState<VisibilitySettings>(DEFAULT_VISIBILITY);
  const [period, setPeriod] = useState<PeriodOption>('all');
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

  // 期間に基づいてデータをフィルタリング
  const getFilteredData = () => {
    if (period === 'all') return diaries;

    const now = new Date();
    const cutoffDate = new Date();

    switch (period) {
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

    return diaries.filter((d) => {
      const diaryDate = new Date(d.journal_date);
      return diaryDate >= cutoffDate;
    });
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

  // 期間でフィルタリングされたデータを取得
  const filteredDiaries = isMounted ? getFilteredData() : diaries;

  // データを準備
  const chartData = filteredDiaries
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
        d.odTimes !== null,
    )
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>データ推移</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">データがありません</div>
        </CardContent>
      </Card>
    );
  }

  // 睡眠時間の最大値を取得（Y軸の範囲設定用）
  const maxSleepHours = Math.max(...chartData.map((d) => d.sleepHours || 0).filter((h) => h > 0));
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
  };

  // ハイドレーションエラーを防ぐため、マウント後にのみレンダリング
  if (!isMounted) {
    return (
      <Card className="border-none bg-muted/50">
        <CardHeader>
          <CardTitle>データ推移</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">読み込み中...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-none bg-muted/80">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>データ推移</CardTitle>
          <Select value={period} onValueChange={handlePeriodChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERIOD_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 60 }}>
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
              domain={[0, 10]}
              tick={{ fontSize: 12, fill: 'oklch(0.129 0.042 264.695)' }}
              stroke="oklch(0.129 0.042 264.695)"
              label={{
                value: 'スコア（折れ線グラフ）',
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
              domain={[0, sleepYAxisMax]}
              tick={{ fontSize: 12, fill: 'oklch(0.129 0.042 264.695)' }}
              stroke="oklch(0.129 0.042 264.695)"
              label={{
                value: '睡眠時間・OD回数（棒グラフ）',
                angle: 90,
                position: 'right',
                offset: -7.5,
                fill: 'oklch(0.129 0.042 264.695)',
                style: {
                  textAnchor: 'middle',
                },
              }}
            />
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
                            日付
                          </span>
                          <span className="font-bold">
                            {format(data.date, 'yyyy年M月d日 (E)', { locale: ja })}
                          </span>
                        </div>
                        {payload.map((entry, index) => {
                          if (!entry.value && entry.value !== 0) return null;
                          const isLevel =
                            entry.dataKey?.toString().includes('Level') ||
                            entry.dataKey?.toString() === 'sleepQuality';
                          const isOdTimes = entry.dataKey?.toString() === 'odTimes';
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
                                  ? `${entry.value}/5`
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
                yAxisId="right"
                dataKey="sleepHours"
                fill={colors.sleepHoursBar}
                stroke={colors.sleepHours}
                strokeWidth={1}
                name="睡眠時間"
                radius={[4, 4, 0, 0]}
              />
            )}
            {/* 感情スコア（折れ線） */}
            {visibility.mood && (
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="mood"
                stroke={colors.mood}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6 }}
                name="感情スコア"
              />
            )}
            {/* 7項目（折れ線） */}
            {visibility.sleepQuality && (
              <Line
                yAxisId="left"
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
                yAxisId="left"
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
                yAxisId="left"
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
                yAxisId="left"
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
                yAxisId="left"
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
                yAxisId="left"
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
                yAxisId="left"
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
                yAxisId="left"
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
                yAxisId="left"
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
                感情スコア
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
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// 後方互換性のため、古いコンポーネント名もエクスポート
export const MoodChart = UnifiedChart;
export const LevelChart = UnifiedChart;
