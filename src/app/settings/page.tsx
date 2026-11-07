import { requireAuth } from '@/lib/auth';
import { getBankPurposesAction } from '@/app/actions/bank-purpose';
import { SettingsForm } from './settings-form';
import { ScreenHelpButton } from '@/components/layout/screen-help-button';

export default async function SettingsPage() {
  const { userProfile } = await requireAuth();
  const listed = await getBankPurposesAction();
  const purposes = 'purposes' in listed ? listed.purposes : [];

  return (
    <div className="aurialy ">
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-white/90">設定</h1>
          <ScreenHelpButton
            title="設定画面について"
            description="設定画面では、ユーザー設定・アカウント管理を行えます。"
            items={[
              'プロフィール編集',
              '収支の用途（項目の追加・削除と文字色）',
              '通知設定（将来実装）',
              'AI設定（将来実装）',
              'アカウント削除',
            ]}
          />
        </div>

        <SettingsForm userProfile={userProfile} initialPurposes={purposes} />
      </div>
    </div>
  );
}
