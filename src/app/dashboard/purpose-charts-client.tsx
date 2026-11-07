'use client';

import dynamic from 'next/dynamic';
import type { PurposeChartPurpose, PurposeChartTransaction } from '@/lib/bank-purpose-chart';

const PurposeChartsNoSSR = dynamic(
  () => import('./purpose-charts').then((mod) => mod.PurposeCharts),
  {
    ssr: false,
    loading: () => (
      <div className="py-8 text-center text-muted-foreground md:col-span-2">
        グラフを読み込み中...
      </div>
    ),
  },
);

type PurposeChartsClientProps = {
  transactions: PurposeChartTransaction[];
  purposes: PurposeChartPurpose[];
};

export function PurposeChartsClient({ transactions, purposes }: PurposeChartsClientProps) {
  return <PurposeChartsNoSSR transactions={transactions} purposes={purposes} />;
}
