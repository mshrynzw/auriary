'use client';

import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import Link from 'next/link';

type Diary = {
  id: number;
  journal_date: string;
  note: string | null;
  mood: number | null;
  sleep_quality: number | null;
};

type CalendarViewProps = {
  diaries: Diary[];
};

export function CalendarView({ diaries }: CalendarViewProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  // 日記がある日付をマーク
  const diaryDates = diaries.map((d) => new Date(d.journal_date));

  // 選択された日付の日記を取得
  const selectedDiary = selectedDate
    ? diaries.find(
        (d) =>
          format(new Date(d.journal_date), 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd'),
      )
    : null;

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>カレンダー</CardTitle>
          <CardDescription>日記をカレンダー形式で確認</CardDescription>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            modifiers={{
              hasDiary: diaryDates,
            }}
            modifiersClassNames={{
              hasDiary: 'bg-primary text-primary-foreground',
            }}
            className="rounded-md border"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>選択日の日記</CardTitle>
          <CardDescription>
            {selectedDate
              ? format(selectedDate, 'yyyy年M月d日 (E)', { locale: ja })
              : '日付を選択してください'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {selectedDiary ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {selectedDiary.mood && (
                  <Badge variant="outline">感情: {selectedDiary.mood}/10</Badge>
                )}
                {selectedDiary.sleep_quality && (
                  <Badge variant="outline">睡眠: {selectedDiary.sleep_quality}/5</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground line-clamp-4">
                {selectedDiary.note || '本文なし'}
              </p>
              <Link href={`/diary/${selectedDiary.id}`}>
                <Button variant="outline" className="w-full cursor-pointer">
                  詳細を見る
                </Button>
              </Link>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              {selectedDate ? 'この日の日記はありません' : '日付を選択してください'}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
