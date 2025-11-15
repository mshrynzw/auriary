# 詳細設計書：API設計（App Router）

## 6. API設計（App Router）

### 6.1 Route Handlers（/app/api/**）

**実装予定のエンドポイント:**

#### 6.1.1 日記 CRUD

**GET /api/diaries**
- 日記一覧を取得
- クエリパラメータ：`?page=1&limit=20&start_date=...&end_date=...`
- レスポンス：`{ diaries: Diary[], total: number }`

**GET /api/diaries/[id]**
- 個別日記を取得
- レスポンス：`{ diary: Diary }`

**POST /api/diaries**
- 新規日記を作成
- リクエストボディ：`{ diary_date: string, note: string, ... }`
- レスポンス：`{ diary: Diary }`

**PATCH /api/diaries/[id]**
- 日記を更新
- リクエストボディ：`{ note?: string, ... }`
- レスポンス：`{ diary: Diary }`

**DELETE /api/diaries/[id]**
- 日記を削除（ソフトデリート）
- レスポンス：`{ success: boolean }`

#### 6.1.2 AI 機能

**POST /api/ai/complete**
- 文章補完を実行
- リクエストボディ：`{ text: string, context?: string }`
- レスポンス：`{ completed_text: string }`

**POST /api/ai/analyze**
- 感情分析・トピック分析を実行
- リクエストボディ：`{ diary_id: number }`
- レスポンス：`{ sentiment: object, topics: string[] }`

**POST /api/ai/summarize**
- 要約を生成
- リクエストボディ：`{ diary_id: number }`
- レスポンス：`{ summary: string }`

#### 6.1.3 認証関連

**POST /api/auth/login**
- Email/Password ログイン
- リクエストボディ：`{ email: string, password: string }`
- レスポンス：`{ user: User, session: Session }`

**POST /api/auth/logout**
- ログアウト
- レスポンス：`{ success: boolean }`

**POST /api/auth/register**
- 新規登録
- リクエストボディ：`{ email: string, password: string, display_name: string }`
- レスポンス：`{ user: User, session: Session }`

### 6.2 バリデーション（Zod）

**実装予定スキーマ:**

```typescript
// src/lib/validators/diary.ts
import { z } from 'zod';

export const createDiarySchema = z.object({
  diary_date: z.date(),
  note: z.string().max(10000).optional(),
  sleep_quality: z.number().min(1).max(5).optional(),
  wake_level: z.number().min(1).max(5).optional(),
  daytime_level: z.number().min(1).max(5).optional(),
  pre_sleep_level: z.number().min(1).max(5).optional(),
  med_adherence_level: z.number().min(1).max(5).optional(),
  appetite_level: z.number().min(1).max(5).optional(),
  sleep_desire_level: z.number().min(1).max(5).optional(),
  has_od: z.boolean().optional(),
});

export const updateDiarySchema = createDiarySchema.partial();
```

### 6.3 エラーハンドリング

**エラーレスポンス形式:**
```typescript
{
  error: {
    code: string;
    message: string;
    details?: any;
  }
}
```

**主要エラーコード:**
- `UNAUTHORIZED`：認証エラー
- `FORBIDDEN`：権限エラー
- `NOT_FOUND`：リソースが見つからない
- `VALIDATION_ERROR`：バリデーションエラー
- `INTERNAL_ERROR`：サーバーエラー

### 6.4 認証フロー

**API Route での認証チェック:**
```typescript
// src/app/api/diaries/route.ts
import { createSupabaseServerClient } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: '認証が必要です' } },
      { status: 401 }
    );
  }
  
  // ユーザーIDを取得してクエリ実行
  // ...
}
```

---

**関連ドキュメント:**
- [基本設計書](./100_BasicDesign.md)
- [機能設計](./204_DetailedDesign_Functions.md)
- [セキュリティ設計](./208_DetailedDesign_08_Security.md)

