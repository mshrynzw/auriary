'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createDiarySchema, updateDiarySchema, type CreateDiaryInput, type UpdateDiaryInput } from '@/lib/validators/diary';
import { createDiaryAction, updateDiaryAction } from '@/app/actions/diary';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';

type Diary = {
  id: number;
  journal_date: string;
  note: string | null;
  sleep_quality: number | null;
  wake_level: number | null;
  daytime_level: number | null;
  pre_sleep_level: number | null;
  med_adherence_level: number | null;
  appetite_level: number | null;
  sleep_desire_level: number | null;
  has_od: boolean | null;
  sleep_start_at: string | null;
  sleep_end_at: string | null;
  bath_start_at: string | null;
  bath_end_at: string | null;
};

type DiaryEditorProps = {
  diary?: Diary;
};

export function DiaryEditor({ diary }: DiaryEditorProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const isEdit = !!diary;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateDiaryInput | UpdateDiaryInput>({
    resolver: zodResolver(isEdit ? updateDiarySchema : createDiarySchema) as any,
    defaultValues: diary
      ? {
          journal_date: diary.journal_date,
          note: diary.note || '',
          sleep_quality: diary.sleep_quality || undefined,
          wake_level: diary.wake_level || undefined,
          daytime_level: diary.daytime_level || undefined,
          pre_sleep_level: diary.pre_sleep_level || undefined,
          med_adherence_level: diary.med_adherence_level || undefined,
          appetite_level: diary.appetite_level || undefined,
          sleep_desire_level: diary.sleep_desire_level || undefined,
          has_od: diary.has_od || false,
        }
      : {
          journal_date: format(new Date(), 'yyyy-MM-dd'),
        },
  });

  const sleepQuality = watch('sleep_quality') ?? 3;
  const wakeLevel = watch('wake_level') ?? 3;
  const daytimeLevel = watch('daytime_level') ?? 3;

  const onSubmit = async (data: CreateDiaryInput | UpdateDiaryInput) => {
    setIsLoading(true);
    setError(null);

    try {
      if (isEdit) {
        const result = await updateDiaryAction(diary.id, data as UpdateDiaryInput);
        if (result?.error) {
          setError(result.error.message);
          toast.error(result.error.message);
        } else {
          toast.success('日記を更新しました');
          router.push('/diary');
        }
      } else {
        const result = await createDiaryAction(data as CreateDiaryInput);
        if (result?.error) {
          setError(result.error.message);
          toast.error(result.error.message);
        } else {
          toast.success('日記を作成しました');
          router.push('/diary');
        }
      }
    } catch (err) {
      setError('予期しないエラーが発生しました');
      toast.error('予期しないエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEdit ? '日記を編集' : '新しい日記を作成'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="journal_date">日付</Label>
            <Input
              id="journal_date"
              type="date"
              {...register('journal_date')}
              disabled={isLoading}
            />
            {errors.journal_date && (
              <p className="text-sm text-destructive">{errors.journal_date.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="note">日記本文</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Markdown形式で記述できます</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Textarea
              id="note"
              placeholder="今日の出来事を記録しましょう..."
              rows={10}
              {...register('note')}
              disabled={isLoading}
            />
            {errors.note && (
              <p className="text-sm text-destructive">{errors.note.message}</p>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label>睡眠の質: {sleepQuality}/5</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>1=とても悪い、5=とても良い</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Slider
                value={[sleepQuality]}
                onValueChange={(value) => setValue('sleep_quality', value[0])}
                min={1}
                max={5}
                step={1}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label>起床時の気分: {wakeLevel}/5</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>1=最悪、5=とても良い</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Slider
                value={[wakeLevel]}
                onValueChange={(value) => setValue('wake_level', value[0])}
                min={1}
                max={5}
                step={1}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label>日中の気分: {daytimeLevel}/5</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>1=最悪、5=とても良い</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Slider
                value={[daytimeLevel]}
                onValueChange={(value) => setValue('daytime_level', value[0])}
                min={1}
                max={5}
                step={1}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isLoading}
            >
              キャンセル
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? '保存中...' : isEdit ? '更新' : '作成'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

