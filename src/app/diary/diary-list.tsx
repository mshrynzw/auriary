'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import {
  compareAsc,
  endOfMonth,
  format,
  parseISO,
  startOfDay,
  startOfMonth,
  subMonths,
} from 'date-fns';
import { ja } from 'date-fns/locale';
import { Loader2 } from 'lucide-react';
import { DiaryPreviewDialog } from './diary-preview-dialog';
import { DiaryEditDeleteButtons } from '@/components/diary/diary-edit-delete-buttons';
import { type DiaryRow } from '@/schemas';
import { SentimentText } from '@/components/diary/sentiment-text';
import { getDiariesAction } from '@/app/actions/diary';

function mergeDedupe(prev: DiaryRow[], batch: DiaryRow[]) {
  const ids = new Set(prev.map((d) => d.id));
  const merged = [...prev];
  for (const d of batch) {
    if (!ids.has(d.id)) {
      ids.add(d.id);
      merged.push(d);
    }
  }
  return merged;
}

/** その月に、最古日付以降の日記が存在しうるか（無限スクロール終了判定） */
function monthCouldHaveEntries(monthStart: Date, earliestISO: string) {
  const earliest = startOfDay(parseISO(earliestISO));
  return compareAsc(endOfMonth(monthStart), earliest) >= 0;
}

type DiaryListProps = {
  initialDiaries: DiaryRow[];
  earliestJournalDate: string | null;
  initialPastMonthStart: string;
  isAuthenticated?: boolean;
};

type DiaryFilter = {
  keyword: string;
  startDate: string;
  endDate: string;
};

function isRangeInvalid(startDate: string, endDate: string) {
  return Boolean(startDate && endDate && startDate > endDate);
}

function hasFilterValue(filter: DiaryFilter) {
  return Boolean(filter.keyword || filter.startDate || filter.endDate);
}

export function DiaryList({
  initialDiaries,
  earliestJournalDate,
  initialPastMonthStart,
  isAuthenticated = false,
}: DiaryListProps) {
  const [previewDiary, setPreviewDiary] = useState<DiaryRow | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const [keyword, setKeyword] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [activeFilter, setActiveFilter] = useState<DiaryFilter | null>(null);
  const [filteredDiaries, setFilteredDiaries] = useState<DiaryRow[] | null>(null);
  const [filterLoading, setFilterLoading] = useState(false);
  const [filterError, setFilterError] = useState<string | null>(null);

  const [browseDiaries, setBrowseDiaries] = useState<DiaryRow[]>(initialDiaries);
  const [cursor, setCursor] = useState(() => startOfMonth(parseISO(initialPastMonthStart)));
  const [loading, setLoading] = useState(
    () => initialDiaries.length === 0 && !!earliestJournalDate,
  );
  const loadingRef = useRef(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const rangeInvalid = isRangeInvalid(startDate, endDate);
  const isFiltering = activeFilter !== null;
  const diaries = isFiltering ? (filteredDiaries ?? []) : browseDiaries;
  const canReset = Boolean(keyword.trim() || startDate || endDate || isFiltering);

  const applyFilter = useCallback((next: DiaryFilter) => {
    const normalized: DiaryFilter = {
      keyword: next.keyword.trim(),
      startDate: next.startDate,
      endDate: next.endDate,
    };
    if (!hasFilterValue(normalized) || isRangeInvalid(normalized.startDate, normalized.endDate)) {
      setActiveFilter(null);
      return;
    }
    setActiveFilter((prev) => {
      if (
        prev &&
        prev.keyword === normalized.keyword &&
        prev.startDate === normalized.startDate &&
        prev.endDate === normalized.endDate
      ) {
        return prev;
      }
      return normalized;
    });
  }, []);

  useEffect(() => {
    if (isRangeInvalid(startDate, endDate)) return;
    const timer = setTimeout(() => {
      applyFilter({ keyword, startDate, endDate });
    }, 300);
    return () => clearTimeout(timer);
  }, [keyword, startDate, endDate, applyFilter]);

  useEffect(() => {
    if (!activeFilter) {
      setFilteredDiaries(null);
      setFilterError(null);
      setFilterLoading(false);
      return;
    }

    let cancelled = false;
    setFilterLoading(true);
    setFilterError(null);
    setFilteredDiaries(null);

    void (async () => {
      const res = await getDiariesAction({
        keyword: activeFilter.keyword || undefined,
        start_date: activeFilter.startDate || undefined,
        end_date: activeFilter.endDate || undefined,
      });
      if (cancelled) return;
      if ('error' in res && res.error) {
        setFilterError(res.error.message);
        setFilteredDiaries([]);
      } else {
        setFilteredDiaries(res.diaries ?? []);
      }
      setFilterLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [activeFilter]);

  const hasMore = useMemo(
    () =>
      !isFiltering && !!earliestJournalDate && monthCouldHaveEntries(cursor, earliestJournalDate),
    [cursor, earliestJournalDate, isFiltering],
  );

  const loadMore = useCallback(async () => {
    if (loadingRef.current || !earliestJournalDate || isFiltering) return;

    const earliest = earliestJournalDate;
    let m = cursor;
    if (!monthCouldHaveEntries(m, earliest)) return;

    loadingRef.current = true;
    setLoading(true);
    try {
      while (monthCouldHaveEntries(m, earliest)) {
        const start = format(m, 'yyyy-MM-dd');
        const end = format(endOfMonth(m), 'yyyy-MM-dd');
        const res = await getDiariesAction({ start_date: start, end_date: end });
        if ('error' in res && res.error) return;
        const batch = res.diaries ?? [];
        if (batch.length > 0) {
          setBrowseDiaries((prev) => mergeDedupe(prev, batch));
          setCursor(subMonths(m, 1));
          return;
        }
        m = subMonths(m, 1);
      }
      setCursor(m);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [cursor, earliestJournalDate, isFiltering]);

  useEffect(() => {
    if (initialDiaries.length > 0) return;
    if (!earliestJournalDate) {
      setLoading(false);
      return;
    }

    const earliest = earliestJournalDate;
    let cancelled = false;

    async function bootstrap() {
      setLoading(true);
      try {
        let monthCursor = startOfMonth(parseISO(initialPastMonthStart));
        while (!cancelled && monthCouldHaveEntries(monthCursor, earliest)) {
          const start = format(monthCursor, 'yyyy-MM-dd');
          const end = format(endOfMonth(monthCursor), 'yyyy-MM-dd');
          const res = await getDiariesAction({ start_date: start, end_date: end });
          if (cancelled) return;
          if ('error' in res && res.error) break;
          const batch = res.diaries ?? [];
          if (batch.length > 0) {
            setBrowseDiaries(batch);
            setCursor(subMonths(monthCursor, 1));
            break;
          }
          monthCursor = subMonths(monthCursor, 1);
          setCursor(monthCursor);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, [initialDiaries.length, earliestJournalDate, initialPastMonthStart]);

  useEffect(() => {
    if (!hasMore || loading) return;
    const el = sentinelRef.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          void loadMore();
        }
      },
      { root: null, rootMargin: '240px', threshold: 0 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasMore, loading, loadMore]);

  const handlePreview = (diary: DiaryRow) => {
    setPreviewDiary(diary);
    setIsPreviewOpen(true);
  };

  const resetFilters = () => {
    setKeyword('');
    setStartDate('');
    setEndDate('');
    setActiveFilter(null);
  };

  const showFilterSpinner = !rangeInvalid && isFiltering && filterLoading;
  const showFilterEmpty =
    !rangeInvalid && isFiltering && !filterLoading && !filterError && diaries.length === 0;
  const showBrowseSpinner = !isFiltering && !rangeInvalid && loading && diaries.length === 0;
  const showBrowseEmpty = !isFiltering && !rangeInvalid && !loading && diaries.length === 0;

  return (
    <>
      <form
        className="mb-6 flex flex-col gap-3 rounded-lg bg-muted/40 p-4 sm:flex-row sm:flex-wrap sm:items-end"
        onSubmit={(event) => {
          event.preventDefault();
          if (!rangeInvalid) applyFilter({ keyword, startDate, endDate });
        }}
      >
        <div className="min-w-0 flex-1 space-y-1.5 sm:min-w-56">
          <Label htmlFor="diary-keyword">キーワード</Label>
          <Input
            id="diary-keyword"
            type="search"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            placeholder="本文を検索"
            autoComplete="off"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="diary-start-date">開始日</Label>
          <Input
            id="diary-start-date"
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
            className="w-full sm:w-auto"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="diary-end-date">終了日</Label>
          <Input
            id="diary-end-date"
            type="date"
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
            className="w-full sm:w-auto"
          />
        </div>
        <Button type="button" variant="outline" onClick={resetFilters} disabled={!canReset}>
          リセット
        </Button>
      </form>

      {rangeInvalid && (
        <p className="mb-4 text-sm text-destructive">開始日は終了日以前にしてください</p>
      )}
      {filterError && !rangeInvalid && (
        <p className="mb-4 text-sm text-destructive">{filterError}</p>
      )}

      {showFilterSpinner || showBrowseSpinner ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : null}

      {showFilterEmpty && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">該当する日記がありません</p>
          </CardContent>
        </Card>
      )}

      {showBrowseEmpty && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">まだ日記がありません</p>
            <Link href="/diary/new" className="mt-4 inline-block">
              <Button>最初の日記を作成</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {!rangeInvalid && !showFilterSpinner && !showBrowseSpinner && diaries.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {diaries.map((diary) => (
            <Card
              key={diary.id}
              className="border-none bg-muted/50 hover:bg-muted/70 transition-colors cursor-pointer"
              onClick={() => handlePreview(diary)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">
                      {format(new Date(diary.journal_date), 'yyyy年M月d日 (E)', { locale: ja })}
                    </CardTitle>
                  </div>
                  <div className="flex items-center gap-1">
                    {diary.mood && (
                      <Badge variant="outline">感情スコア（AI分析）: {diary.mood}/10</Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm line-clamp-3 mb-4">
                  {diary.note ? (
                    <SentimentText
                      text={diary.note}
                      highlightedWords={diary.sentiment_analysis_result?.highlighted_words || []}
                    />
                  ) : (
                    <span className="text-muted-foreground">本文なし</span>
                  )}
                </div>
                <DiaryEditDeleteButtons diaryId={diary.id} isAuthenticated={isAuthenticated} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {hasMore && (
        <div ref={sentinelRef} className="flex justify-center py-8 min-h-16" aria-hidden>
          {loading ? <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /> : null}
        </div>
      )}

      <DiaryPreviewDialog
        diary={previewDiary}
        open={isPreviewOpen}
        onOpenChange={setIsPreviewOpen}
      />
    </>
  );
}
