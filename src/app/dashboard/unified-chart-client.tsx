'use client';

import dynamic from 'next/dynamic';
import { type DiaryRow } from '@/schemas';

const UnifiedChartNoSSR = dynamic(() => import('./charts').then((mod) => mod.UnifiedChart), {
  ssr: false,
  loading: () => <div className="text-center py-8 text-muted-foreground">グラフを読み込み中...</div>,
});

type UnifiedChartClientProps = {
  diaries: DiaryRow[];
};

export function UnifiedChartClient({ diaries }: UnifiedChartClientProps) {
  return <UnifiedChartNoSSR diaries={diaries} />;
}
