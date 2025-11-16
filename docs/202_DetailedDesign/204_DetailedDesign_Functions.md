# 詳細設計書：機能設計

## 4. 機能設計

### 4.1 認証

#### 4.1.1 Supabase Auth（Email / OAuth）

**実装方式:**
- **Email/Password 認証**：メールアドレス + パスワード
- **OAuth 認証**：Google / GitHub など（将来実装）

**フロー:**
```
1. ユーザーがログインフォームに入力
2. Supabase Auth API にリクエスト
3. 認証成功 → Cookie にセッション保存
4. Server Component でセッション検証
```

**セッション管理:**
- `@supabase/ssr` を使用した Cookie ベースのセッション管理
- Server Component で `createSupabaseServerClient()` を使用してセッション取得

**コード例:**
```typescript
// src/lib/supabase.ts
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export function createSupabaseServerClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: '', ...options });
        },
      },
    },
  );
}
```

### 4.2 日記管理機能

#### 4.2.1 作成 / 更新 / 削除

**CRUD 操作:**
- **作成**：`POST /api/diaries` または Server Action
- **更新**：`PATCH /api/diaries/[id]`
- **削除**：`DELETE /api/diaries/[id]`（ソフトデリート）

**RLS によるユーザースコープ:**
- すべてのクエリは `user_id` でフィルタリング
- RLS ポリシーで自動的にユーザー自身のデータのみアクセス可能

**データフロー:**
```
1. ユーザーが日記を保存
2. Server Action / API Route で Supabase に保存
3. RLS ポリシーで自動的に user_id を付与
4. 保存成功後、AI Summary 生成をトリガー（非同期）
```

#### 4.2.2 AI Summary 生成フロー

**実装方式:**
- 日記保存後にバックグラウンドで OpenAI API を呼び出し
- 結果を `t_diaries.ai_summary` に保存（将来実装）

**フロー:**
```
日記保存 → Server Action → 
  → Supabase に保存
  → OpenAI API 呼び出し（非同期）
  → 感情分析 + トピック抽出
  → 結果を DB に更新
```

### 4.3 タグ管理

#### 4.3.1 自動タグ生成（AI）

**実装方式:**
- OpenAI API で日記本文を分析
- 主要トピックを抽出してタグとして自動付与
- 結果を `t_diaries.ai_topics`（JSON）に保存（将来実装）

#### 4.3.2 手動追加

**実装方式:**
- ユーザーが日記編集画面でタグを手動追加
- `t_diary_tags` テーブルに紐付け（将来実装）

### 4.4 カレンダー

#### 4.4.1 月/週/日ビュー切替

**実装方式:**
- `Tabs` コンポーネントでビュー切替
- `Calendar` コンポーネント（shadcn/ui）を使用

#### 4.4.2 フィルタリング

**フィルタ条件:**
- 期間（開始日・終了日）
- 感情スコア範囲
- タグ
- キーワード検索

### 4.5 ダッシュボード機能

#### 4.5.1 統計情報表示

**実装方式:**
- Server Component で日記データを取得
- 統計情報を計算してカード表示

**表示項目:**
- 総日記数
- 今月の日記数
- 平均感情スコア（全期間）
- 平均睡眠の質（全期間）

#### 4.5.2 データ可視化（統合グラフ）

**実装方式:**
- `recharts` ライブラリを使用
- `ComposedChart` で複数のデータ系列を表示
- Client Component でインタラクティブな操作を実現

**表示可能なデータ:**
- 感情スコア（0-10、折れ線グラフ）
- 睡眠時間（時間、棒グラフ）
- 睡眠の質（0-5、折れ線グラフ）
- 起床時の気分（0-5、折れ線グラフ）
- 日中の気分（0-5、折れ線グラフ）
- 就寝前の気分（0-5、折れ線グラフ）
- 服薬遵守度（0-5、折れ線グラフ）
- 食欲レベル（0-5、折れ線グラフ）
- 睡眠欲レベル（0-5、折れ線グラフ）

**機能:**
- 表示項目の切り替え（チェックボックス）
- 期間選択（全期間、過去1ヶ月、過去3ヶ月、過去6ヶ月、過去1年）
- ローカルストレージへの設定保存

#### 4.5.3 最近の日記表示

**実装方式:**
- 最新5件の日記を取得
- 日記カード形式で表示
- クリックで詳細画面へ遷移

#### 4.5.4 クイックアクション

**実装方式:**
- 主要な画面へのリンクを提供
- 新規作成、日記一覧、カレンダー、分析画面への導線

### 4.6 AI機能

#### 4.6.1 文章補完

**実装方式:**
- エディタ内でリアルタイム補完（オプション）
- ボタンクリックで補完実行
- OpenAI API（ChatGPT）を使用

**プロンプト例:**
```
ユーザーの日記本文を続きを書いてください。
文体は自然で、ユーザーの書き方に合わせてください。
```

#### 4.6.2 感情分析

**実装方式:**
- 日記本文を OpenAI API に送信
- 感情スコア（1-5）を返却
- 結果を `t_diaries.mood` に保存（将来実装）

**出力形式:**
```json
{
  "sentiment": "positive" | "neutral" | "negative",
  "score": 1-5,
  "confidence": 0.0-1.0
}
```

#### 4.6.3 Topic Modeling

**実装方式:**
- 日記本文から主要トピックを抽出
- 結果を `t_diaries.ai_topics`（JSON 配列）に保存（将来実装）

**出力形式:**
```json
{
  "topics": ["仕事", "健康", "家族"],
  "weights": [0.8, 0.6, 0.4]
}
```

#### 4.6.4 Summary 生成

**実装方式:**
- 日記本文の要約を生成
- 結果を `t_diaries.ai_summary` に保存（将来実装）

### 4.7 通知機能（将来実装）

#### 4.7.1 プッシュ通知（Web Push）

**実装方式:**
- Web Push API を使用したブラウザプッシュ通知
- Service Worker で通知を受信
- プッシュ通知の購読情報を `t_push_subscriptions` に保存

**通知タイミング:**
- 日記リマインダー（設定した時間に通知）
- 日記未記入リマインダー（N日連続で日記未記入の場合）
- AI分析完了通知（感情分析・要約生成完了時）

**フロー:**
```
1. ユーザーがプッシュ通知を許可
2. Service Worker で Push Subscription を取得
3. Subscription を Supabase に保存
4. 通知送信時、Supabase Edge Function または API Route で送信
5. Service Worker で通知を受信・表示
```

**コード例:**
```typescript
// src/lib/push-notification.ts
export async function subscribePushNotification(userId: string) {
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  });
  
  // Supabase に保存
  await supabase.from('t_push_subscriptions').insert({
    user_id: userId,
    subscription: subscription.toJSON(),
    is_active: true,
  });
}
```

#### 4.7.2 メール自動送信

**実装方式:**
- Supabase Edge Functions または外部サービス（SendGrid / Resend など）を使用
- メールテンプレートを Supabase Storage または環境変数で管理

**送信タイミング:**
- 新規登録時のウェルカムメール
- パスワードリセットメール（Supabase Auth の機能を使用）
- 週次サマリーメール（過去1週間の日記サマリー）
- 日記未記入リマインダー（メール通知設定がONの場合）

**フロー:**
```
1. トリガーイベント発生（日記保存、ユーザー登録など）
2. Supabase Edge Function または API Route でメール送信処理
3. メール送信サービス（SendGrid / Resend）にリクエスト
4. 送信ログを `t_email_logs` に保存（将来実装）
```

**コード例:**
```typescript
// supabase/functions/send-email/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

serve(async (req) => {
  const { to, subject, template, data } = await req.json();
  
  // Resend または SendGrid を使用してメール送信
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'noreply@auriary.app',
      to,
      subject,
      html: renderTemplate(template, data),
    }),
  });
  
  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
```

#### 4.7.3 アプリ内通知

**実装方式:**
- データベースベースの通知システム
- `t_notifications` テーブルに通知を保存
- リアルタイム更新は Supabase Realtime を使用（将来実装）

**通知種別:**
- `diary_reminder`: 日記リマインダー
- `diary_missing`: 日記未記入リマインダー
- `ai_analysis_complete`: AI分析完了
- `weekly_summary`: 週次サマリー
- `system`: システム通知

**フロー:**
```
1. 通知イベント発生
2. `t_notifications` テーブルに通知レコードを作成
3. ユーザーが通知一覧画面で確認
4. 通知をクリックで既読に更新
5. 通知設定に基づいてプッシュ通知・メール送信も実行
```

**コード例:**
```typescript
// src/lib/notifications.ts
export async function createNotification(
  userId: number,
  type: NotificationType,
  title: string,
  message: string,
  linkUrl?: string
) {
  const supabase = createSupabaseServerClient();
  
  // 通知設定を確認
  const { data: settings } = await supabase
    .from('m_notification_settings')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  // アプリ内通知を作成
  const { data: notification } = await supabase
    .from('t_notifications')
    .insert({
      user_id: userId,
      type,
      title,
      message,
      link_url: linkUrl,
      is_read: false,
    })
    .select()
    .single();
  
  // プッシュ通知設定がONの場合、プッシュ通知を送信
  if (settings?.push_enabled && settings?.[`push_${type}`]) {
    await sendPushNotification(userId, title, message, linkUrl);
  }
  
  // メール通知設定がONの場合、メールを送信
  if (settings?.email_enabled && settings?.[`email_${type}`]) {
    await sendEmailNotification(userId, title, message);
  }
  
  return notification;
}
```

#### 4.7.4 通知設定

**実装方式:**
- `m_notification_settings` テーブルでユーザーごとの通知設定を管理
- 設定画面（`/settings/notifications`）で設定を変更可能

**設定項目:**
- プッシュ通知の有効/無効
- メール通知の有効/無効
- 通知種別ごとのON/OFF設定
- 日記リマインダーの時間設定
- 日記未記入リマインダーの日数設定

### 4.8 PWA機能（将来実装）

#### 4.8.1 インストール可能（Installable）

**目的:**
スマートフォンでネイティブアプリのように使用できるように、ホーム画面にインストール可能にする機能。インストール後はブラウザのUI（アドレスバー、タブバーなど）が非表示となり、スタンドアロンモードで起動する。

**実装方式:**
- `manifest.json` を設定してPWAとして認識させる
- インストールプロンプトを表示
- ホーム画面に追加可能にする
- スタンドアロンモード（`display: "standalone"`）で起動
- ネイティブアプリと同様の起動体験を提供

**manifest.json の設定:**
```json
{
  "name": "auriary - AI Diary App",
  "short_name": "auriary",
  "description": "AI と連携して日々の記録を楽に・美しく残せる日記アプリ",
  "start_url": "/",
  "display": "standalone",  // ブラウザUIを非表示にしてネイティブアプリのように起動
  "background_color": "#ffffff",  // スプラッシュスクリーンの背景色
  "theme_color": "#000000",  // ステータスバーの色（Android）
  "icons": [
    {
      "src": "/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "orientation": "portrait-primary",
  "scope": "/",
  "categories": ["lifestyle", "productivity"]
}
```

**インストールプロンプト:**
```typescript
// src/components/pwa/InstallPrompt.tsx
'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 right-4 p-4 bg-white border rounded-lg shadow-lg">
      <p>アプリをインストールして、より快適にご利用ください</p>
      <Button onClick={handleInstall}>インストール</Button>
    </div>
  );
}
```

#### 4.8.2 オフライン対応

**実装方式:**
- Service Worker によるキャッシング戦略
- IndexedDB によるオフラインストレージ
- オンライン復帰時の自動同期

**キャッシング戦略:**
- **Cache First**: 静的アセット（CSS、JS、画像）
- **Network First**: API レスポンス（日記データ）
- **Stale While Revalidate**: ページHTML

**Service Worker 実装例:**
```typescript
// public/sw.js
const CACHE_NAME = 'auriary-v1';
const STATIC_CACHE = 'auriary-static-v1';
const API_CACHE = 'auriary-api-v1';

// インストール時に静的アセットをキャッシュ
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll([
        '/',
        '/diary',
        '/manifest.json',
        '/icon-192x192.png',
        '/icon-512x512.png',
      ]);
    })
  );
  self.skipWaiting();
});

// フェッチ時にキャッシュを確認
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 静的アセットは Cache First
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.match(request).then((response) => {
        return response || fetch(request);
      })
    );
    return;
  }

  // API リクエストは Network First
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(API_CACHE).then((cache) => {
            cache.put(request, clone);
          });
          return response;
        })
        .catch(() => {
          return caches.match(request);
        })
    );
    return;
  }

  // その他は Network First
  event.respondWith(
    fetch(request).catch(() => {
      return caches.match(request);
    })
  );
});
```

#### 4.8.3 オフライン時の動作

**閲覧機能:**
- 既にキャッシュされた日記データを表示可能
- オフラインインジケーターを表示

**下書き保存:**
- IndexedDB に下書きを保存
- オンライン復帰時に自動的にSupabaseに同期

**コード例:**
```typescript
// src/lib/offline-storage.ts
import { openDB, DBSchema } from 'idb';

interface DiaryDraft {
  id?: number;
  diary_date: string;
  note: string;
  // ... その他のフィールド
}

interface AuriaryDB extends DBSchema {
  drafts: {
    key: number;
    value: DiaryDraft;
  };
}

export async function saveDraft(draft: DiaryDraft) {
  const db = await openDB<AuriaryDB>('auriary', 1, {
    upgrade(db) {
      db.createObjectStore('drafts', { keyPath: 'id', autoIncrement: true });
    },
  });

  await db.put('drafts', draft);
}

export async function syncDrafts() {
  const db = await openDB<AuriaryDB>('auriary', 1);
  const drafts = await db.getAll('drafts');

  for (const draft of drafts) {
    try {
      // Supabase に保存
      await createDiary(draft);
      // 成功したら IndexedDB から削除
      await db.delete('drafts', draft.id!);
    } catch (error) {
      console.error('Failed to sync draft:', error);
    }
  }
}
```

#### 4.8.4 オフラインインジケーター

**実装方式:**
- `navigator.onLine` でオンライン/オフラインを検知
- オフライン時にバナーを表示

**コード例:**
```typescript
// src/components/pwa/OfflineIndicator.tsx
'use client';

import { useEffect, useState } from 'react';
import { Alert } from '@/components/ui/alert';

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <Alert className="fixed top-0 left-0 right-0 z-50">
      オフラインです。一部の機能が制限されます。
    </Alert>
  );
}
```

---

**関連ドキュメント:**
- [基本設計書](./100_BasicDesign.md)
- [API設計](./206_DetailedDesign_API.md)
- [データベース設計](./205_DetailedDesign_Database.md)
- [全体アーキテクチャ](./202_DetailedDesign_Architecture.md)

