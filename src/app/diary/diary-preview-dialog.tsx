'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Calendar, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { type DiaryRow } from '@/schemas';
import { SentimentText } from '@/components/diary/sentiment-text';

type DiaryPreviewDialogProps = {
  diary: DiaryRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function DiaryPreviewDialog({ diary, open, onOpenChange }: DiaryPreviewDialogProps) {
  if (!diary) return null;

  const formatDateTime = (dateTime: string | null) => {
    if (!dateTime) return null;
    return format(new Date(dateTime), 'yyyy年M月d日 H:mm', { locale: ja });
  };

  const formatTime = (dateTime: string | null) => {
    if (!dateTime) return null;
    return format(new Date(dateTime), 'H:mm', { locale: ja });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {format(new Date(diary.journal_date), 'yyyy年M月d日 (E)', { locale: ja })}
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {format(new Date(diary.journal_date), 'yyyy-MM-dd')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* 日記本文 */}
          {diary.note && (
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">日記本文</h3>
              <div className="prose prose-sm max-w-none">
                <SentimentText text={diary.note} diaryId={diary.id} className="text-sm" />
              </div>
            </div>
          )}

          {/* 気分・体調スコア */}
          {(diary.sleep_quality ||
            diary.wake_level ||
            diary.daytime_level ||
            diary.pre_sleep_level ||
            diary.med_adherence_level ||
            diary.appetite_level ||
            diary.sleep_desire_level) && (
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">気分・体調</h3>
              <div className="grid gap-3 md:grid-cols-2">
                {diary.sleep_quality && (
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="text-sm font-medium">睡眠の質</span>
                    <Badge variant="outline">{diary.sleep_quality}/5</Badge>
                  </div>
                )}
                {diary.wake_level && (
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="text-sm font-medium">起床時の気分</span>
                    <Badge variant="outline">{diary.wake_level}/5</Badge>
                  </div>
                )}
                {diary.daytime_level && (
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="text-sm font-medium">日中の気分</span>
                    <Badge variant="outline">{diary.daytime_level}/5</Badge>
                  </div>
                )}
                {diary.pre_sleep_level && (
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="text-sm font-medium">就寝前の気分</span>
                    <Badge variant="outline">{diary.pre_sleep_level}/5</Badge>
                  </div>
                )}
                {diary.med_adherence_level && (
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="text-sm font-medium">服薬遵守度</span>
                    <Badge variant="outline">{diary.med_adherence_level}/5</Badge>
                  </div>
                )}
                {diary.appetite_level && (
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="text-sm font-medium">食欲レベル</span>
                    <Badge variant="outline">{diary.appetite_level}/5</Badge>
                  </div>
                )}
                {diary.sleep_desire_level && (
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="text-sm font-medium">睡眠欲レベル</span>
                    <Badge variant="outline">{diary.sleep_desire_level}/5</Badge>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 時刻記録 */}
          {(diary.sleep_start_at ||
            diary.sleep_end_at ||
            diary.bath_start_at ||
            diary.bath_end_at) && (
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">時刻記録</h3>
              <div className="grid gap-3 md:grid-cols-2">
                {diary.sleep_end_at && (
                  <div className="flex items-center gap-2 p-3 border rounded-lg">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">起床時刻</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDateTime(diary.sleep_end_at)}
                      </p>
                    </div>
                  </div>
                )}
                {diary.sleep_start_at && (
                  <div className="flex items-center gap-2 p-3 border rounded-lg">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">就寝時刻</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDateTime(diary.sleep_start_at)}
                      </p>
                    </div>
                  </div>
                )}
                {diary.bath_start_at && (
                  <div className="flex items-center gap-2 p-3 border rounded-lg">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">入浴開始時刻</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDateTime(diary.bath_start_at)}
                      </p>
                    </div>
                  </div>
                )}
                {diary.bath_end_at && (
                  <div className="flex items-center gap-2 p-3 border rounded-lg">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">入浴終了時刻</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDateTime(diary.bath_end_at)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* OD発生フラグ */}
          {diary.has_od !== null && (
            <div className="space-y-2">
              <h3 className="font-bold text-lg">OD発生</h3>
              <div className="flex items-center gap-2">
                {diary.has_od ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-destructive" />
                    <span className="text-sm font-medium text-destructive">ODが発生しました</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">
                      ODは発生していません
                    </span>
                  </>
                )}
              </div>
            </div>
          )}

          <Separator />

          {/* メタ情報 */}
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              作成日時: {format(new Date(diary.created_at), 'yyyy年M月d日 H:mm', { locale: ja })}
            </p>
            {diary.updated_at !== diary.created_at && (
              <p>
                更新日時: {format(new Date(diary.updated_at), 'yyyy年M月d日 H:mm', { locale: ja })}
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
