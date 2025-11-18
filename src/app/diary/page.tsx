import { requireAuth } from '@/lib/auth';
import { getDiariesAction } from '@/app/actions/diary';
import { DiaryList } from './diary-list';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { Info } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default async function DiaryPage() {
  const { userProfile } = await requireAuth();
  const result = await getDiariesAction({ limit: 50 });

  const diaries = result.diaries || [];

  return (
    <div className="min-h-screen ">
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-white/90">日記一覧</h1>
        </div>

        <DiaryList diaries={diaries} />
      </div>
    </div>
  );
}
