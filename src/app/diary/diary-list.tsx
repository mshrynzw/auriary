'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2, Calendar, Eye } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { deleteDiaryAction } from '@/app/actions/diary';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DiaryPreviewDialog } from './diary-preview-dialog';
import { type DiaryRow } from '@/schemas';

type DiaryListProps = {
  diaries: DiaryRow[];
  isAuthenticated?: boolean;
};

export function DiaryList({ diaries, isAuthenticated = false }: DiaryListProps) {
  const router = useRouter();
  const [previewDiary, setPreviewDiary] = useState<DiaryRow | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const handleDelete = async (id: number) => {
    const result = await deleteDiaryAction(id);
    if (result?.error) {
      toast.error(result.error.message);
    } else {
      toast.success('日記を削除しました');
      router.refresh();
    }
  };

  const handlePreview = (diary: DiaryRow) => {
    setPreviewDiary(diary);
    setIsPreviewOpen(true);
  };
  const stopPropagation = (event: React.MouseEvent) => {
    event.stopPropagation();
  };

  if (diaries.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">まだ日記がありません</p>
          <Link href="/diary/new" className="mt-4 inline-block">
            <Button>最初の日記を作成</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
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
                  {/* <CardDescription className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {format(new Date(diary.journal_date), 'yyyy-MM-dd')}
                  </CardDescription> */}
                </div>
                <div className="flex items-center gap-1">
                  {diary.mood && <Badge variant="outline">感情: {diary.mood}/10</Badge>}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm line-clamp-3 mb-4">{diary.note || ''}</p>
              {isAuthenticated && (
                <div className="flex items-center justify-end gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Link href={`/diary/${diary.id}/edit`} onClick={stopPropagation}>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={stopPropagation}
                            className="cursor-pointer"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>日記を編集</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={stopPropagation}
                              className="cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>日記を削除しますか？</AlertDialogTitle>
                              <AlertDialogDescription>
                                この操作は取り消せません。日記が完全に削除されます。
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>キャンセル</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(diary.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                削除
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>日記を削除</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      <DiaryPreviewDialog
        diary={previewDiary}
        open={isPreviewOpen}
        onOpenChange={setIsPreviewOpen}
      />
    </>
  );
}
