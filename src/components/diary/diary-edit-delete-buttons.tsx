'use client';

import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';
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

type DiaryEditDeleteButtonsProps = {
  diaryId: number;
  isAuthenticated: boolean;
};

export function DiaryEditDeleteButtons({ diaryId, isAuthenticated }: DiaryEditDeleteButtonsProps) {
  const router = useRouter();

  const handleDelete = async (id: number) => {
    const result = await deleteDiaryAction(id);
    if (result?.error) {
      toast.error(result.error.message);
    } else {
      toast.success('日記を削除しました');
      router.refresh();
    }
  };

  const stopPropagation = (event: React.MouseEvent) => {
    event.stopPropagation();
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex items-center justify-end gap-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link href={`/diary/${diaryId}/edit`} onClick={stopPropagation}>
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
                    onClick={() => handleDelete(diaryId)}
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
  );
}
