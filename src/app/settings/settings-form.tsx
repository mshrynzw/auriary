'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { toast } from 'sonner';
import { getDailyDefaultsAction, saveDailyDefaultsAction } from '@/app/actions/daily-defaults';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info, Loader2 } from 'lucide-react';

type UserProfile = {
  id: number;
  display_name: string;
  email: string | null;
};

type SettingsFormProps = {
  userProfile: UserProfile | null;
};

export function SettingsForm({ userProfile }: SettingsFormProps) {
  const [isLoadingDefaults, setIsLoadingDefaults] = useState(true);
  const [isSavingDefaults, setIsSavingDefaults] = useState(false);
  const [defaults, setDefaults] = useState({
    sleep_quality_default: 3,
    wake_level_default: 3,
    daytime_level_default: 3,
    pre_sleep_level_default: 3,
    med_adherence_level_default: 3,
    appetite_level_default: 3,
    sleep_desire_level_default: 3,
    exercise_level_default: 3,
    sleep_start_at_default: null as string | null,
    sleep_end_at_default: null as string | null,
    bath_start_at_default: null as string | null,
    bath_end_at_default: null as string | null,
  });

  useEffect(() => {
    const loadDefaults = async () => {
      setIsLoadingDefaults(true);
      const result = await getDailyDefaultsAction();
      if (result?.defaults) {
        setDefaults({
          sleep_quality_default: result.defaults.sleep_quality_default || 3,
          wake_level_default: result.defaults.wake_level_default || 3,
          daytime_level_default: result.defaults.daytime_level_default || 3,
          pre_sleep_level_default: result.defaults.pre_sleep_level_default || 3,
          med_adherence_level_default: result.defaults.med_adherence_level_default || 3,
          appetite_level_default: result.defaults.appetite_level_default || 3,
          sleep_desire_level_default: result.defaults.sleep_desire_level_default || 3,
          exercise_level_default: result.defaults.exercise_level_default || 3,
          sleep_start_at_default: result.defaults.sleep_start_at_default || null,
          sleep_end_at_default: result.defaults.sleep_end_at_default || null,
          bath_start_at_default: result.defaults.bath_start_at_default || null,
          bath_end_at_default: result.defaults.bath_end_at_default || null,
        });
      }
      setIsLoadingDefaults(false);
    };
    loadDefaults();
  }, []);

  const handleProfileSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    toast.info('設定の保存機能は将来実装予定です');
  };

  const handleDefaultsSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSavingDefaults(true);

    // 空文字列をnullに変換
    const submitData = {
      ...defaults,
      sleep_start_at_default:
        defaults.sleep_start_at_default === '' ? null : defaults.sleep_start_at_default,
      sleep_end_at_default:
        defaults.sleep_end_at_default === '' ? null : defaults.sleep_end_at_default,
      bath_start_at_default:
        defaults.bath_start_at_default === '' ? null : defaults.bath_start_at_default,
      bath_end_at_default:
        defaults.bath_end_at_default === '' ? null : defaults.bath_end_at_default,
    };

    const result = await saveDailyDefaultsAction(submitData);
    if (result?.error) {
      toast.error(result.error.message);
    } else {
      toast.success('デフォルト設定を保存しました');
    }
    setIsSavingDefaults(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>プロフィール設定</CardTitle>
          <CardDescription>アカウント情報を編集</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="display_name">表示名</Label>
              <Input id="display_name" defaultValue={userProfile?.display_name || ''} disabled />
              <p className="text-xs text-muted-foreground">表示名の編集機能は将来実装予定です</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">メールアドレス</Label>
              <Input id="email" type="email" defaultValue={userProfile?.email || ''} disabled />
              <p className="text-xs text-muted-foreground">
                メールアドレスの変更機能は将来実装予定です
              </p>
            </div>
            <Button type="submit" disabled>
              保存（将来実装）
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>通知設定</CardTitle>
          <CardDescription>プッシュ通知・メール通知の設定</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">通知設定機能は将来実装予定です</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>日記のデフォルト設定</CardTitle>
          <CardDescription>
            日記を書かなかった日に使用するデフォルト値を設定します。強迫観念を減らすための基準値です。
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingDefaults ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <form onSubmit={handleDefaultsSubmit} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label>睡眠の質: {defaults.sleep_quality_default}/5</Label>
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
                    value={[defaults.sleep_quality_default]}
                    onValueChange={(value) =>
                      setDefaults({ ...defaults, sleep_quality_default: value[0] })
                    }
                    min={1}
                    max={5}
                    step={1}
                    disabled={isSavingDefaults}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label>起床時の気分: {defaults.wake_level_default}/5</Label>
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
                    value={[defaults.wake_level_default]}
                    onValueChange={(value) =>
                      setDefaults({ ...defaults, wake_level_default: value[0] })
                    }
                    min={1}
                    max={5}
                    step={1}
                    disabled={isSavingDefaults}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label>日中の気分: {defaults.daytime_level_default}/5</Label>
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
                    value={[defaults.daytime_level_default]}
                    onValueChange={(value) =>
                      setDefaults({ ...defaults, daytime_level_default: value[0] })
                    }
                    min={1}
                    max={5}
                    step={1}
                    disabled={isSavingDefaults}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label>就寝前の気分: {defaults.pre_sleep_level_default}/5</Label>
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
                    value={[defaults.pre_sleep_level_default]}
                    onValueChange={(value) =>
                      setDefaults({ ...defaults, pre_sleep_level_default: value[0] })
                    }
                    min={1}
                    max={5}
                    step={1}
                    disabled={isSavingDefaults}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label>服薬遵守度: {defaults.med_adherence_level_default}/5</Label>
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
                    value={[defaults.med_adherence_level_default]}
                    onValueChange={(value) =>
                      setDefaults({ ...defaults, med_adherence_level_default: value[0] })
                    }
                    min={1}
                    max={5}
                    step={1}
                    disabled={isSavingDefaults}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label>食欲レベル: {defaults.appetite_level_default}/5</Label>
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
                    value={[defaults.appetite_level_default]}
                    onValueChange={(value) =>
                      setDefaults({ ...defaults, appetite_level_default: value[0] })
                    }
                    min={1}
                    max={5}
                    step={1}
                    disabled={isSavingDefaults}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label>睡眠欲レベル: {defaults.sleep_desire_level_default}/5</Label>
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
                    value={[defaults.sleep_desire_level_default]}
                    onValueChange={(value) =>
                      setDefaults({ ...defaults, sleep_desire_level_default: value[0] })
                    }
                    min={1}
                    max={5}
                    step={1}
                    disabled={isSavingDefaults}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label>運動レベル: {defaults.exercise_level_default}/5</Label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>1=全くしない、5=たくさんする</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <Slider
                    value={[defaults.exercise_level_default]}
                    onValueChange={(value) =>
                      setDefaults({ ...defaults, exercise_level_default: value[0] })
                    }
                    min={1}
                    max={5}
                    step={1}
                    disabled={isSavingDefaults}
                  />
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">時刻デフォルト設定</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="sleep_start_at_default">起床時刻</Label>
                    <Input
                      id="sleep_start_at_default"
                      type="time"
                      value={defaults.sleep_start_at_default || ''}
                      onChange={(e) =>
                        setDefaults({ ...defaults, sleep_start_at_default: e.target.value || null })
                      }
                      disabled={isSavingDefaults}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sleep_end_at_default">就寝時刻</Label>
                    <Input
                      id="sleep_end_at_default"
                      type="time"
                      value={defaults.sleep_end_at_default || ''}
                      onChange={(e) =>
                        setDefaults({ ...defaults, sleep_end_at_default: e.target.value || null })
                      }
                      disabled={isSavingDefaults}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bath_start_at_default">入浴開始時刻</Label>
                    <Input
                      id="bath_start_at_default"
                      type="time"
                      value={defaults.bath_start_at_default || ''}
                      onChange={(e) =>
                        setDefaults({ ...defaults, bath_start_at_default: e.target.value || null })
                      }
                      disabled={isSavingDefaults}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bath_end_at_default">入浴終了時刻</Label>
                    <Input
                      id="bath_end_at_default"
                      type="time"
                      value={defaults.bath_end_at_default || ''}
                      onChange={(e) =>
                        setDefaults({ ...defaults, bath_end_at_default: e.target.value || null })
                      }
                      disabled={isSavingDefaults}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end">
                <Button type="submit" disabled={isSavingDefaults}>
                  {isSavingDefaults && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  デフォルト設定を保存
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>AI設定</CardTitle>
          <CardDescription>AI補完レベルなどの設定</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">AI設定機能は将来実装予定です</p>
        </CardContent>
      </Card>
    </div>
  );
}
