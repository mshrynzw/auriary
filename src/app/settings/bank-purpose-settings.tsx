'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { Check, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  createBankPurposeAction,
  deleteBankPurposeAction,
  updateBankPurposeAction,
} from '@/app/actions/bank-purpose';
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
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  bankPurposeNameMaxLength,
  bankPurposeTextColor,
  defaultBankPurposeTextColor,
  type BankPurpose,
} from '@/schemas/tables/m_bank_purposes';

type BankPurposeSettingsProps = {
  initialPurposes: BankPurpose[];
};

export function BankPurposeSettings({ initialPurposes }: BankPurposeSettingsProps) {
  const [purposes, setPurposes] = useState(initialPurposes);
  const [name, setName] = useState('');
  const [color, setColor] = useState(defaultBankPurposeTextColor);
  const [isAdding, setIsAdding] = useState(false);

  const onAdd = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isAdding) return;
    setIsAdding(true);
    try {
      const result = await createBankPurposeAction({ name, textColor: color });
      if ('error' in result) {
        toast.error(result.error.message);
        return;
      }
      const purpose = result.purpose;
      setPurposes((prev) => [...prev, purpose]);
      setName('');
      setColor(defaultBankPurposeTextColor);
      toast.success('用途を追加しました');
    } catch (error) {
      console.error(error);
      toast.error('用途の追加に失敗しました');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>収支の用途</CardTitle>
        <CardDescription>
          明細一覧の「用途」で選ぶ項目です。文字色もここで決めます。削除すると、その用途を選んでいた明細は未設定に戻ります。
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {purposes.length === 0 ? (
          <p className="text-sm text-muted-foreground">用途はまだありません。</p>
        ) : (
          <ul className="space-y-3">
            {purposes.map((purpose) => (
              <li key={purpose.id}>
                <PurposeEditor
                  purpose={purpose}
                  onUpdated={(next) =>
                    setPurposes((prev) => prev.map((item) => (item.id === next.id ? next : item)))
                  }
                  onDeleted={(id) => setPurposes((prev) => prev.filter((item) => item.id !== id))}
                />
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={onAdd} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="space-y-2">
            <Label htmlFor="new-bank-purpose-color">文字色</Label>
            <input
              id="new-bank-purpose-color"
              type="color"
              value={color}
              onChange={(event) => setColor(event.target.value)}
              className="h-9 w-14 cursor-pointer rounded-md border bg-background p-1"
            />
          </div>
          <div className="flex-1 space-y-2">
            <Label htmlFor="new-bank-purpose-name">用途名</Label>
            <Input
              id="new-bank-purpose-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={bankPurposeNameMaxLength}
              placeholder="食費"
            />
          </div>
          <Button type="submit" disabled={isAdding || name.trim().length === 0}>
            {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : '追加'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function PurposeEditor({
  purpose,
  onUpdated,
  onDeleted,
}: {
  purpose: BankPurpose;
  onUpdated: (purpose: BankPurpose) => void;
  onDeleted: (id: number) => void;
}) {
  const [name, setName] = useState(purpose.name);
  const [color, setColor] = useState(purpose.text_color);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setName(purpose.name);
    setColor(purpose.text_color);
  }, [purpose.name, purpose.text_color]);

  useEffect(() => {
    if (status !== 'saved') return;
    const timer = window.setTimeout(() => setStatus('idle'), 2000);
    return () => window.clearTimeout(timer);
  }, [status]);

  const save = async (nextName: string, nextColor: string) => {
    if (nextName.trim() === purpose.name && nextColor.toLowerCase() === purpose.text_color) {
      setName(purpose.name);
      setColor(purpose.text_color);
      return;
    }
    setStatus('saving');
    try {
      const result = await updateBankPurposeAction({
        id: purpose.id,
        name: nextName,
        textColor: nextColor,
      });
      if ('error' in result) {
        setStatus('error');
        setName(purpose.name);
        setColor(purpose.text_color);
        toast.error(result.error.message);
        return;
      }
      const saved = result.purpose;
      setName(saved.name);
      setColor(saved.text_color);
      setStatus('saved');
      onUpdated(saved);
    } catch (error) {
      console.error(error);
      setStatus('error');
      setName(purpose.name);
      setColor(purpose.text_color);
      toast.error('用途の保存に失敗しました');
    }
  };

  const onDelete = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      const result = await deleteBankPurposeAction({ id: purpose.id });
      if ('error' in result && result.error) {
        toast.error(result.error.message);
        return;
      }
      onDeleted(purpose.id);
      toast.success('用途を削除しました');
    } catch (error) {
      console.error(error);
      toast.error('用途の削除に失敗しました');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={color}
        aria-label={`${purpose.name}の文字色`}
        onChange={(event) => setColor(event.target.value)}
        onBlur={(event) => void save(name, event.currentTarget.value)}
        disabled={status === 'saving' || isDeleting}
        className="h-9 w-14 shrink-0 cursor-pointer rounded-md border bg-background p-1"
      />
      <Input
        value={name}
        aria-label={`${purpose.name}の名前`}
        maxLength={bankPurposeNameMaxLength}
        onChange={(event) => setName(event.target.value)}
        onBlur={(event) => void save(event.currentTarget.value, color)}
        disabled={status === 'saving' || isDeleting}
        style={{ color: bankPurposeTextColor(color) }}
        className="h-9"
      />
      {status === 'saving' && (
        <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
      )}
      {status === 'saved' && <Check className="h-4 w-4 shrink-0 text-emerald-600" />}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label={`${purpose.name}を削除`}
            disabled={isDeleting}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>用途を削除しますか？</AlertDialogTitle>
            <AlertDialogDescription>
              「{purpose.name}」を削除します。この用途を選んでいる明細は未設定に戻ります。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction onClick={() => void onDelete()}>削除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
