'use client';

import dynamic from 'next/dynamic';
import { type DiaryRow } from '@/schemas';

const BloodPressureChartsNoSSR = dynamic(
  () => import('./blood-pressure-charts').then((mod) => mod.BloodPressureCharts),
  {
    ssr: false,
    loading: () => (
      <div className="text-center py-8 text-muted-foreground">グラフを読み込み中...</div>
    ),
  },
);

type BloodPressureChartsClientProps = {
  diaries: DiaryRow[];
};

export function BloodPressureChartsClient({ diaries }: BloodPressureChartsClientProps) {
  return <BloodPressureChartsNoSSR diaries={diaries} />;
}
