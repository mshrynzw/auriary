# 詳細設計書：エラーハンドリング

## エラーハンドリング

Next.js 16 におけるエラーハンドリングの方針を定めます。Error Boundaries、グローバルエラーハンドリング、Server Actions でのエラー処理を統一します。

---

## 1. Error Boundaries

### 基本実装

**実装場所：** `app/error.tsx`

```typescript
'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h2 className="text-2xl font-bold mb-4">エラーが発生しました</h2>
      <p className="text-muted-foreground mb-4">
        {error.message || '予期しないエラーが発生しました'}
      </p>
      <button
        onClick={reset}
        className="px-4 py-2 bg-primary text-primary-foreground rounded"
      >
        再試行
      </button>
    </div>
  );
}
```

### ルート別の Error Boundary

**実装場所：** `app/diary/error.tsx`

```typescript
'use client';

export default function DiaryError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div>
      <h2>日記の読み込みに失敗しました</h2>
      <p>{error.message}</p>
      <button onClick={reset}>再試行</button>
    </div>
  );
}
```

---

## 2. Server Components でのエラーハンドリング

### try-catch パターン

```typescript
export default async function DiaryPage() {
  try {
    const diaries = await getDiaries();
    return <DiaryList diaries={diaries} />;
  } catch (error) {
    // Error Boundary にエラーを渡す
    throw error;
  }
}
```

### エラーを返すパターン

```typescript
export default async function DiaryPage() {
  const result = await getDiaries();
  
  if (result.error) {
    return <ErrorMessage message={result.error} />;
  }
  
  return <DiaryList diaries={result.data} />;
}
```

---

## 3. Server Actions でのエラーハンドリング

### エラーを返すパターン

```typescript
'use server';

export async function createDiary(data: DiaryData) {
  try {
    const result = await saveDiaryToDB(data);
    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'エラーが発生しました',
    };
  }
}
```

### エラーを throw するパターン

```typescript
'use server';

export async function createDiary(data: DiaryData) {
  const validated = createDiarySchema.safeParse(data);
  
  if (!validated.success) {
    throw new Error('バリデーションエラー: ' + validated.error.message);
  }
  
  const result = await saveDiaryToDB(validated.data);
  
  if (!result) {
    throw new Error('日記の作成に失敗しました');
  }
  
  revalidateTag('diaries');
}
```

---

## 4. クライアント側でのエラーハンドリング

### Server Action のエラー処理

```typescript
'use client';

import { createDiary } from '@/app/actions/diary';
import { useTransition } from 'react';

export function DiaryForm() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  
  const handleSubmit = async (formData: FormData) => {
    setError(null);
    
    startTransition(async () => {
      try {
        const result = await createDiary(formData);
        
        if (!result.success) {
          setError(result.error || 'エラーが発生しました');
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : 'エラーが発生しました');
      }
    });
  };
  
  return (
    <form action={handleSubmit}>
      {error && <div className="error">{error}</div>}
      {/* フォームフィールド */}
    </form>
  );
}
```

---

## 5. グローバルエラーハンドリング

### global-error.tsx

**実装場所：** `app/global-error.tsx`

```typescript
'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div>
          <h2>重大なエラーが発生しました</h2>
          <p>{error.message}</p>
          <button onClick={reset}>再試行</button>
        </div>
      </body>
    </html>
  );
}
```

---

## 6. エラーログ

### サーバー側のエラーログ

```typescript
export async function getDiaries() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from('t_diaries')
      .select('*');
    
    if (error) {
      console.error('Supabase エラー:', error);
      throw new Error('日記の取得に失敗しました');
    }
    
    return data;
  } catch (error) {
    console.error('日記取得エラー:', error);
    throw error;
  }
}
```

### クライアント側のエラーログ

```typescript
'use client';

export function ErrorLogger({ error }: { error: Error }) {
  useEffect(() => {
    // エラー追跡サービスに送信（将来実装）
    // Sentry.captureException(error);
    console.error('クライアントエラー:', error);
  }, [error]);
  
  return null;
}
```

---

## 7. エラーメッセージの統一

### エラーメッセージの定義

**実装場所：** `src/lib/errors.ts`

```typescript
export const ErrorMessages = {
  UNAUTHORIZED: '認証が必要です',
  FORBIDDEN: 'アクセス権限がありません',
  NOT_FOUND: 'リソースが見つかりません',
  VALIDATION_ERROR: '入力値に誤りがあります',
  DATABASE_ERROR: 'データベースエラーが発生しました',
  NETWORK_ERROR: 'ネットワークエラーが発生しました',
  UNKNOWN_ERROR: '予期しないエラーが発生しました',
} as const;

export class AppError extends Error {
  constructor(
    message: string,
    public code: keyof typeof ErrorMessages,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'AppError';
  }
}
```

### エラーの使用例

```typescript
import { AppError, ErrorMessages } from '@/lib/errors';

export async function requireAuth() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new AppError(
      ErrorMessages.UNAUTHORIZED,
      'UNAUTHORIZED',
      401
    );
  }
  
  return user;
}
```

---

## 8. ベストプラクティス

### 1. エラーの分類

- **ユーザーエラー**：入力ミスなど、ユーザーが修正可能
- **システムエラー**：サーバーエラーなど、ユーザーが修正不可
- **ネットワークエラー**：一時的な問題

### 2. エラーメッセージ

- ユーザーに分かりやすいメッセージを表示
- 技術的な詳細はログに記録
- 機密情報をエラーメッセージに含めない

### 3. エラーの回復

- 再試行可能な操作は「再試行」ボタンを提供
- 一時的なエラーは自動リトライを検討

### 4. ログ記録

- すべてのエラーをログに記録
- 本番環境では Sentry などのエラー追跡サービスを統合（将来実装）

---

**関連ドキュメント:**
- [基本設計書](../100_BasicDesign/100_BasicDesign.md)
- [Next.js 16 実装方針（概要）](./321_NextJS_Implementation_Overview.md)
- [ログ・監査](../202_DetailedDesign/209_DetailedDesign_Logging.md)

