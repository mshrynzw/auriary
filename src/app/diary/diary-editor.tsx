'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  createDiaryFormSchema,
  updateDiaryFormSchema,
  type CreateDiaryFormInput,
  type UpdateDiaryFormInput,
  type DiaryRow,
  type UserDailyDefaults,
} from '@/schemas';
import { createDiaryAction, updateDiaryAction } from '@/app/actions/diary';
import { getMedicationsAction } from '@/app/actions/medication';
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
import { Info, Plus, Minus } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { OdTimeFormItem } from '@/schemas/forms/diary-form';
import type { MedicationRow } from '@/schemas';

// デフォルト設定の必要なフィールドのみを抽出
type DailyDefaults = Pick<
  UserDailyDefaults,
  | 'sleep_quality_default'
  | 'wake_level_default'
  | 'daytime_level_default'
  | 'pre_sleep_level_default'
  | 'med_adherence_level_default'
  | 'appetite_level_default'
  | 'sleep_desire_level_default'
  | 'sleep_start_at_default'
  | 'sleep_end_at_default'
  | 'bath_start_at_default'
  | 'bath_end_at_default'
>;

type DiaryEditorProps = {
  diary?: DiaryRow;
  defaults?: DailyDefaults;
};

export function DiaryEditor({ diary, defaults }: DiaryEditorProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [medications, setMedications] = useState<MedicationRow[]>([]);
  const isEdit = !!diary;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    getValues,
    trigger,
    formState: { errors },
  } = useForm<CreateDiaryFormInput | UpdateDiaryFormInput>({
    resolver: zodResolver(isEdit ? updateDiaryFormSchema : createDiaryFormSchema) as any,
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
          od_times: diary.od_times
            ? diary.od_times.map((item) => ({
                occurred_at: format(new Date(item.occurred_at), "yyyy-MM-dd'T'HH:mm"),
                medication_id: item.medication_id ?? null,
                medication_name: item.medication_name ?? null,
                amount: item.amount ?? null,
                amount_unit: item.amount_unit ?? null,
                context_memo: item.context_memo ?? null,
                source_id: item.source_id ?? null,
              }))
            : [],
          // 既存の時刻がある場合はそのまま使用、ない場合はデフォルト時刻を適用
          sleep_start_at: diary.sleep_start_at
            ? format(new Date(diary.sleep_start_at), "yyyy-MM-dd'T'HH:mm")
            : defaults?.sleep_start_at_default
              ? `${diary.journal_date}T${defaults.sleep_start_at_default}`
              : undefined,
          sleep_end_at: diary.sleep_end_at
            ? format(new Date(diary.sleep_end_at), "yyyy-MM-dd'T'HH:mm")
            : defaults?.sleep_end_at_default
              ? `${diary.journal_date}T${defaults.sleep_end_at_default}`
              : undefined,
          bath_start_at: diary.bath_start_at
            ? format(new Date(diary.bath_start_at), "yyyy-MM-dd'T'HH:mm")
            : defaults?.bath_start_at_default
              ? `${diary.journal_date}T${defaults.bath_start_at_default}`
              : undefined,
          bath_end_at: diary.bath_end_at
            ? format(new Date(diary.bath_end_at), "yyyy-MM-dd'T'HH:mm")
            : defaults?.bath_end_at_default
              ? `${diary.journal_date}T${defaults.bath_end_at_default}`
              : undefined,
        }
      : {
          // 日付はuseEffectでクライアント側でのみ設定（ハイドレーションエラーを防ぐため）
          journal_date: '',
          sleep_quality: defaults?.sleep_quality_default,
          wake_level: defaults?.wake_level_default,
          daytime_level: defaults?.daytime_level_default,
          pre_sleep_level: defaults?.pre_sleep_level_default,
          med_adherence_level: defaults?.med_adherence_level_default,
          appetite_level: defaults?.appetite_level_default,
          sleep_desire_level: defaults?.sleep_desire_level_default,
          od_times: [],
          // 時刻フィールドはuseEffectでクライアント側でのみ設定
          sleep_start_at: undefined,
          sleep_end_at: undefined,
          bath_start_at: undefined,
          bath_end_at: undefined,
        },
  });

  const sleepQuality = watch('sleep_quality') ?? defaults?.sleep_quality_default ?? 3;
  const wakeLevel = watch('wake_level') ?? defaults?.wake_level_default ?? 3;
  const daytimeLevel = watch('daytime_level') ?? defaults?.daytime_level_default ?? 3;
  const preSleepLevel = watch('pre_sleep_level') ?? defaults?.pre_sleep_level_default ?? 3;
  const medAdherenceLevel =
    watch('med_adherence_level') ?? defaults?.med_adherence_level_default ?? 3;
  const appetiteLevel = watch('appetite_level') ?? defaults?.appetite_level_default ?? 3;
  const sleepDesireLevel = watch('sleep_desire_level') ?? defaults?.sleep_desire_level_default ?? 3;
  const hasOd = watch('has_od') ?? false;
  const odTimes = watch('od_times') ?? [];

  const journalDate = watch('journal_date');

  // 薬マスタを取得
  useEffect(() => {
    const fetchMedications = async () => {
      const result = await getMedicationsAction();
      if (result?.medications) {
        setMedications(result.medications);
      }
    };
    fetchMedications();
  }, []);

  // 新規作成時、初期値とjournal_dateが変更されたときに時刻フィールドの日付を設定
  useEffect(() => {
    if (!isEdit) {
      // 初期値として当日の日付を設定
      const today = format(new Date(), 'yyyy-MM-dd');
      const currentJournalDate = journalDate || today;

      // journal_dateが空の場合は設定
      if (!journalDate) {
        setValue('journal_date', today);
      }

      // 各時刻フィールドの現在の値を取得
      const sleepStartAt = getValues('sleep_start_at');
      const sleepEndAt = getValues('sleep_end_at');
      const bathStartAt = getValues('bath_start_at');
      const bathEndAt = getValues('bath_end_at');

      // 日付部分を抽出して更新（時刻部分は保持）
      const updateDateTime = (
        currentValue: string | undefined,
        defaultTime: string | null | undefined,
      ) => {
        // 現在の値がない、または日付が一致しない場合は更新
        if (!currentValue || !currentValue.includes(currentJournalDate)) {
          if (defaultTime) {
            // defaultTimeは既にHH:mm形式（例: "21:00"）なので、そのまま使用
            return `${currentJournalDate}T${defaultTime}`;
          }
          // defaultTimeがない場合はundefinedを返す（空のまま）
          return undefined;
        }
        return currentValue;
      };

      // 各フィールドを更新（バリデーションをスキップして設定）
      // 初期値設定時はバリデーションを実行しない（ユーザーが入力した時のみバリデーション）
      const newSleepStartAt = updateDateTime(sleepStartAt, defaults?.sleep_start_at_default);
      const newSleepEndAt = updateDateTime(sleepEndAt, defaults?.sleep_end_at_default);
      const newBathStartAt = updateDateTime(bathStartAt, defaults?.bath_start_at_default);
      const newBathEndAt = updateDateTime(bathEndAt, defaults?.bath_end_at_default);

      setValue('sleep_start_at', newSleepStartAt, { shouldValidate: false });
      setValue('sleep_end_at', newSleepEndAt, { shouldValidate: false });
      setValue('bath_start_at', newBathStartAt, { shouldValidate: false });
      setValue('bath_end_at', newBathEndAt, { shouldValidate: false });
    }
  }, [isEdit, journalDate, defaults, setValue, getValues]);

  const onSubmit = async (data: CreateDiaryFormInput | UpdateDiaryFormInput) => {
    setIsLoading(true);
    setError(null);

    try {
      // 日時フィールドをISO8601形式に変換
      const submitData = {
        ...data,
        sleep_start_at: data.sleep_start_at
          ? new Date(data.sleep_start_at).toISOString()
          : undefined,
        sleep_end_at: data.sleep_end_at ? new Date(data.sleep_end_at).toISOString() : undefined,
        bath_start_at: data.bath_start_at ? new Date(data.bath_start_at).toISOString() : undefined,
        bath_end_at: data.bath_end_at ? new Date(data.bath_end_at).toISOString() : undefined,
        // od_timesをISO8601形式に変換
        od_times: data.od_times
          ? data.od_times.map((item) => ({
              occurred_at: new Date(item.occurred_at).toISOString(),
              medication_id: item.medication_id ?? null,
              medication_name: item.medication_name ?? null,
              amount: item.amount ?? null,
              amount_unit: item.amount_unit ?? null,
              context_memo: item.context_memo ?? null,
              source_id: item.source_id ?? null,
            }))
          : undefined,
      };

      if (isEdit) {
        const result = await updateDiaryAction(diary.id, submitData as UpdateDiaryFormInput);
        if (result?.error) {
          setError(result.error.message);
          toast.error(result.error.message);
        } else {
          toast.success('日記を更新しました');
          router.push('/diary');
        }
      } else {
        const result = await createDiaryAction(submitData as CreateDiaryFormInput);
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
            {errors.note && <p className="text-sm text-destructive">{errors.note.message}</p>}
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">気分・体調</h3>
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

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label>就寝前の気分: {preSleepLevel}/5</Label>
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
                    value={[preSleepLevel]}
                    onValueChange={(value) => setValue('pre_sleep_level', value[0])}
                    min={1}
                    max={5}
                    step={1}
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label>服薬遵守度: {medAdherenceLevel}/5</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>1=全く飲めず、5=全部飲めた</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Slider
                    value={[medAdherenceLevel]}
                    onValueChange={(value) => setValue('med_adherence_level', value[0])}
                    min={1}
                    max={5}
                    step={1}
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label>食欲レベル: {appetiteLevel}/5</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>1=ない、5=ある</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Slider
                    value={[appetiteLevel]}
                    onValueChange={(value) => setValue('appetite_level', value[0])}
                    min={1}
                    max={5}
                    step={1}
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label>睡眠欲レベル: {sleepDesireLevel}/5</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>1=ない、5=とてもある</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Slider
                    value={[sleepDesireLevel]}
                    onValueChange={(value) => setValue('sleep_desire_level', value[0])}
                    min={1}
                    max={5}
                    step={1}
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">時刻記録</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="sleep_end_at">起床時刻</Label>
                  <Input
                    id="sleep_end_at"
                    type="datetime-local"
                    value={watch('sleep_end_at') || ''}
                    onChange={(e) => {
                      setValue('sleep_end_at', e.target.value || undefined);
                    }}
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sleep_start_at">就寝時刻</Label>
                  <Input
                    id="sleep_start_at"
                    type="datetime-local"
                    value={watch('sleep_start_at') || ''}
                    onChange={(e) => {
                      setValue('sleep_start_at', e.target.value || undefined);
                    }}
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bath_start_at">入浴開始時刻</Label>
                  <Input
                    id="bath_start_at"
                    type="datetime-local"
                    value={watch('bath_start_at') || ''}
                    onChange={(e) => {
                      setValue('bath_start_at', e.target.value || undefined);
                    }}
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bath_end_at">入浴終了時刻</Label>
                  <Input
                    id="bath_end_at"
                    type="datetime-local"
                    value={watch('bath_end_at') || ''}
                    onChange={(e) => {
                      setValue('bath_end_at', e.target.value || undefined);
                    }}
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="has_od"
                  checked={hasOd}
                  onCheckedChange={(checked) => {
                    const isChecked = checked === true;
                    setValue('has_od', isChecked);
                    // OD発生をONにしたとき、od_timesが空なら初期エントリを追加
                    if (isChecked && odTimes.length === 0) {
                      const currentDate = journalDate || format(new Date(), 'yyyy-MM-dd');
                      setValue('od_times', [
                        {
                          occurred_at: `${currentDate}T00:00`,
                          medication_id: null,
                          medication_name: null,
                          amount: null,
                          amount_unit: null,
                          context_memo: null,
                          source_id: null,
                        },
                      ]);
                    }
                    // OD発生をOFFにしたとき、od_timesをクリア
                    if (!isChecked) {
                      setValue('od_times', []);
                    }
                  }}
                  disabled={isLoading}
                />
                <Label htmlFor="has_od" className="cursor-pointer">
                  OD発生
                </Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>その日にOD（過量服薬）があった場合にチェック</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              {/* OD情報入力UI */}
              {hasOd && (
                <div className="space-y-4 border rounded-lg p-4 bg-muted/30">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">OD記録</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const currentDate = journalDate || format(new Date(), 'yyyy-MM-dd');
                        const currentOdTimes = getValues('od_times') ?? [];
                        setValue('od_times', [
                          ...currentOdTimes,
                          {
                            occurred_at: `${currentDate}T00:00`,
                            amount: null,
                            amount_unit: null,
                            context_memo: null,
                            source_id: null,
                          },
                        ]);
                      }}
                      disabled={isLoading}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      追加
                    </Button>
                  </div>

                  {odTimes.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      「追加」ボタンをクリックしてOD記録を追加してください
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {odTimes.map((_, index) => (
                        <div key={index} className="space-y-3 border rounded-md p-4 bg-background">
                          <div className="flex items-center justify-between mb-2">
                            <Label className="text-sm font-medium">OD記録 #{index + 1}</Label>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const currentOdTimes = getValues('od_times') ?? [];
                                setValue(
                                  'od_times',
                                  currentOdTimes.filter((_, i) => i !== index),
                                );
                                // 最後のエントリを削除した場合、has_odもOFFにする
                                if (currentOdTimes.length === 1) {
                                  setValue('has_od', false);
                                }
                              }}
                              disabled={isLoading}
                              className="text-destructive hover:text-destructive"
                            >
                              <Minus className="h-4 w-4 mr-1" />
                              削除
                            </Button>
                          </div>

                          <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor={`od_occurred_at_${index}`}>
                                  発生日時 <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                  id={`od_occurred_at_${index}`}
                                  type="datetime-local"
                                  value={odTimes[index]?.occurred_at || ''}
                                  onChange={(e) => {
                                    const currentOdTimes = [...(getValues('od_times') ?? [])];
                                    currentOdTimes[index] = {
                                      ...currentOdTimes[index],
                                      occurred_at: e.target.value,
                                    };
                                    setValue('od_times', currentOdTimes);
                                  }}
                                  disabled={isLoading}
                                  required
                                />
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor={`od_medication_${index}`}>薬</Label>
                                <Select
                                  value={
                                    odTimes[index]?.medication_id
                                      ? String(odTimes[index].medication_id)
                                      : 'custom'
                                  }
                                  onValueChange={(value) => {
                                    const currentOdTimes = [...(getValues('od_times') ?? [])];
                                    if (value === 'custom') {
                                      currentOdTimes[index] = {
                                        ...currentOdTimes[index],
                                        medication_id: null,
                                        medication_name:
                                          currentOdTimes[index]?.medication_name || '',
                                      };
                                    } else {
                                      const medication = medications.find(
                                        (m) => m.id === Number(value),
                                      );
                                      currentOdTimes[index] = {
                                        ...currentOdTimes[index],
                                        medication_id: medication ? medication.id : null,
                                        medication_name: medication ? medication.name : null,
                                      };
                                    }
                                    setValue('od_times', currentOdTimes);
                                  }}
                                  disabled={isLoading}
                                >
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder="薬を選択" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="custom">自由入力</SelectItem>
                                    {medications.map((medication) => (
                                      <SelectItem key={medication.id} value={String(medication.id)}>
                                        {medication.name}
                                        {medication.generic_name && (
                                          <span className="text-muted-foreground ml-2">
                                            ({medication.generic_name})
                                          </span>
                                        )}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                {(!odTimes[index]?.medication_id ||
                                  odTimes[index]?.medication_id === null) && (
                                  <Input
                                    id={`od_medication_name_${index}`}
                                    type="text"
                                    placeholder="薬名を入力（例: ロラタジン）"
                                    value={odTimes[index]?.medication_name ?? ''}
                                    onChange={(e) => {
                                      const currentOdTimes = [...(getValues('od_times') ?? [])];
                                      currentOdTimes[index] = {
                                        ...currentOdTimes[index],
                                        medication_name: e.target.value || null,
                                      };
                                      setValue('od_times', currentOdTimes);
                                    }}
                                    disabled={isLoading}
                                  />
                                )}
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label htmlFor={`od_amount_${index}`}>量</Label>
                                  <div className="flex gap-2">
                                    <Input
                                      id={`od_amount_${index}`}
                                      type="number"
                                      step="0.1"
                                      placeholder="例: 10"
                                      value={odTimes[index]?.amount ?? ''}
                                      onChange={(e) => {
                                        const currentOdTimes = [...(getValues('od_times') ?? [])];
                                        currentOdTimes[index] = {
                                          ...currentOdTimes[index],
                                          amount: e.target.value
                                            ? parseFloat(e.target.value)
                                            : null,
                                        };
                                        setValue('od_times', currentOdTimes);
                                      }}
                                      disabled={isLoading}
                                    />
                                    <Input
                                      id={`od_amount_unit_${index}`}
                                      type="text"
                                      placeholder="例: 錠、mg"
                                      value={odTimes[index]?.amount_unit ?? ''}
                                      onChange={(e) => {
                                        const currentOdTimes = [...(getValues('od_times') ?? [])];
                                        currentOdTimes[index] = {
                                          ...currentOdTimes[index],
                                          amount_unit: e.target.value || null,
                                        };
                                        setValue('od_times', currentOdTimes);
                                      }}
                                      disabled={isLoading}
                                      className="w-24"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor={`od_context_memo_${index}`}>状況メモ</Label>
                            <Textarea
                              id={`od_context_memo_${index}`}
                              placeholder="きっかけや状況などを記録..."
                              rows={2}
                              value={odTimes[index]?.context_memo ?? ''}
                              onChange={(e) => {
                                const currentOdTimes = [...(getValues('od_times') ?? [])];
                                currentOdTimes[index] = {
                                  ...currentOdTimes[index],
                                  context_memo: e.target.value || null,
                                };
                                setValue('od_times', currentOdTimes);
                              }}
                              disabled={isLoading}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
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
