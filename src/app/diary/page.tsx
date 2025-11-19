import { getAuth } from '@/lib/auth';
import { getDiariesAction } from '@/app/actions/diary';
import { DiaryList } from './diary-list';

export default async function DiaryPage() {
  const { userProfile } = await getAuth();
  const result = await getDiariesAction({ limit: 50 });

  const diaries = result.diaries || [];

  return (
    <div className="aurialy ">
      <div className="container mx-auto py-8 px-4">
        <DiaryList diaries={diaries} isAuthenticated={!!userProfile} />
      </div>
    </div>
  );
}
