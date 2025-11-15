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

### 4.5 AI機能

#### 4.5.1 文章補完

**実装方式:**
- エディタ内でリアルタイム補完（オプション）
- ボタンクリックで補完実行
- OpenAI API（ChatGPT）を使用

**プロンプト例:**
```
ユーザーの日記本文を続きを書いてください。
文体は自然で、ユーザーの書き方に合わせてください。
```

#### 4.5.2 感情分析

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

#### 4.5.3 Topic Modeling

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

#### 4.5.4 Summary 生成

**実装方式:**
- 日記本文の要約を生成
- 結果を `t_diaries.ai_summary` に保存（将来実装）

---

**関連ドキュメント:**
- [基本設計書](./100_BasicDesign.md)
- [API設計](./206_DetailedDesign_API.md)
- [データベース設計](./205_DetailedDesign_Database.md)

