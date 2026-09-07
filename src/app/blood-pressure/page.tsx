import { requireAuth } from '@/lib/auth';
import { getDiariesAction } from '@/app/actions/diary';
import { BloodPressureChartsClient } from './blood-pressure-charts-client';

export default async function BloodPressurePage() {
  await requireAuth();

  const result = await getDiariesAction();
  const diaries = result.diaries || [];

  return (
    <div className="aurialy">
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold text-white/90 mb-6">血圧</h1>
        <BloodPressureChartsClient diaries={diaries} />
      </div>
    </div>
  );
}
