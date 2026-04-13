'use client';

import dynamic from 'next/dynamic';
import { type BankTransactionRow, type DiaryRow } from '@/schemas';

const UnifiedChartNoSSR = dynamic(() => import('./charts').then((mod) => mod.UnifiedChart), {
  ssr: false,
  loading: () => <div className="text-center py-8 text-muted-foreground">グラフを読み込み中...</div>,
});

type UnifiedChartClientProps = {
  diaries: DiaryRow[];
  transactions: BankTransactionRow[];
};

export function UnifiedChartClient({ diaries, transactions }: UnifiedChartClientProps) {
  return <UnifiedChartNoSSR diaries={diaries} transactions={transactions} />;
}
