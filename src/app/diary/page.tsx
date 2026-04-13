import { getAuth } from '@/lib/auth';
import { getDiariesAction, getEarliestJournalDateAction } from '@/app/actions/diary';
import { DiaryList } from './diary-list';
import { endOfMonth, format, startOfMonth, subMonths } from 'date-fns';

export default async function DiaryPage() {
  const { userProfile } = await getAuth();
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const [result, earliestRes] = await Promise.all([
    getDiariesAction({
      start_date: format(monthStart, 'yyyy-MM-dd'),
      end_date: format(monthEnd, 'yyyy-MM-dd'),
    }),
    getEarliestJournalDateAction(),
  ]);

  const diaries = result.diaries || [];
  const earliestJournalDate = earliestRes.journal_date;
  const initialPastMonthStart = format(subMonths(monthStart, 1), 'yyyy-MM-dd');

  return (
    <div className="aurialy ">
      <div className="container mx-auto py-8 px-4">
        <DiaryList
          initialDiaries={diaries}
          earliestJournalDate={earliestJournalDate}
          initialPastMonthStart={initialPastMonthStart}
          isAuthenticated={!!userProfile}
        />
      </div>
    </div>
  );
}
