# エラーハンドリング規約

## エラーハンドリング規約

本ドキュメントは、auriary プロジェクトにおけるエラーハンドリングの規約を定めたものです。フレームワークに依存しない、一般的なエラーハンドリングのベストプラクティスを定義します。

---

## 基本原則

### 1. エラーは必ず処理する

- エラーを無視しない
- 適切なエラーハンドリングを実装
- ユーザーに分かりやすいエラーメッセージを表示

### 2. エラーメッセージの統一

- エラーメッセージは明確で有用なものにする
- 機密情報をエラーメッセージに含めない
- ユーザーに次のアクションを示す

### 3. エラーログの記録

- すべてのエラーをログに記録
- エラーの詳細情報を記録
- 本番環境では適切なログレベルを使用

---

## エラークラスの定義

### カスタムエラークラス

```typescript
// ✅ Good: カスタムエラークラスを定義
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 'VALIDATION_ERROR', 400, details);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string | number) {
    super(
      `${resource}${id ? ` (ID: ${id})` : ''} が見つかりません`,
      'NOT_FOUND',
      404
    );
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = '認証が必要です') {
    super(message, 'UNAUTHORIZED', 401);
    this.name = 'UnauthorizedError';
  }
}
```

### エラーの使用例

```typescript
// ✅ Good: カスタムエラーを使用
function getDiary(id: number): Promise<Diary> {
  const diary = await findDiary(id);
  
  if (!diary) {
    throw new NotFoundError('日記', id);
  }
  
  return diary;
}

function createDiary(data: DiaryData): Promise<Diary> {
  const validated = validateDiaryData(data);
  
  if (!validated.success) {
    throw new ValidationError('日記データが無効です', validated.error);
  }
  
  // ...
}
```

---

## エラーハンドリングパターン

### try-catch パターン

```typescript
// ✅ Good: try-catch でエラーを処理
async function handleSaveDiary(data: DiaryData) {
  try {
    const diary = await createDiary(data);
    showSuccessMessage('日記を保存しました');
    return diary;
  } catch (error) {
    if (error instanceof ValidationError) {
      showErrorMessage('入力内容に誤りがあります');
    } else if (error instanceof NotFoundError) {
      showErrorMessage('日記が見つかりません');
    } else {
      showErrorMessage('エラーが発生しました');
      console.error('Unexpected error:', error);
    }
    throw error; // 必要に応じて再スロー
  }
}
```

### Result パターン

```typescript
// ✅ Good: Result パターンを使用
type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

async function getDiary(id: number): Promise<Result<Diary, AppError>> {
  try {
    const diary = await findDiary(id);
    
    if (!diary) {
      return {
        success: false,
        error: new NotFoundError('日記', id),
      };
    }
    
    return { success: true, data: diary };
  } catch (error) {
    return {
      success: false,
      error: error instanceof AppError
        ? error
        : new AppError('日記の取得に失敗しました', 'UNKNOWN_ERROR'),
    };
  }
}

// 使用例
const result = await getDiary(1);
if (result.success) {
  console.log(result.data);
} else {
  console.error(result.error.message);
}
```

---

## エラーメッセージの設計

### ユーザー向けメッセージ

```typescript
// ✅ Good: ユーザーに分かりやすいメッセージ
const ErrorMessages = {
  VALIDATION_ERROR: '入力内容に誤りがあります。確認してください。',
  NOT_FOUND: 'お探しのリソースが見つかりません。',
  UNAUTHORIZED: '認証が必要です。ログインしてください。',
  NETWORK_ERROR: 'ネットワークエラーが発生しました。しばらく待ってから再試行してください。',
  UNKNOWN_ERROR: 'エラーが発生しました。問題が続く場合はお問い合わせください。',
} as const;

function getErrorMessage(error: AppError): string {
  return ErrorMessages[error.code as keyof typeof ErrorMessages] 
    ?? ErrorMessages.UNKNOWN_ERROR;
}
```

### 開発者向けメッセージ

```typescript
// ✅ Good: 開発者向けの詳細情報
function logError(error: unknown, context?: Record<string, unknown>) {
  if (error instanceof AppError) {
    console.error({
      name: error.name,
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      details: error.details,
      context,
      stack: error.stack,
    });
  } else {
    console.error('Unexpected error:', error, context);
  }
}
```

---

## エラーの分類

### エラーの種類

1. **ユーザーエラー**: 入力ミスなど、ユーザーが修正可能
2. **システムエラー**: サーバーエラーなど、ユーザーが修正不可
3. **ネットワークエラー**: 一時的な問題、再試行可能

```typescript
// ✅ Good: エラーの分類
function handleError(error: unknown) {
  if (error instanceof ValidationError) {
    // ユーザーエラー: 入力フォームにエラーを表示
    showFormError(error.details);
  } else if (error instanceof NetworkError) {
    // ネットワークエラー: 再試行ボタンを表示
    showRetryButton();
  } else {
    // システムエラー: エラーページを表示
    showErrorPage();
  }
}
```

---

## エラーログの記録

### ログレベルの使い分け

```typescript
// ✅ Good: ログレベルを適切に使用
function logError(error: unknown, level: 'error' | 'warn' = 'error') {
  if (level === 'error') {
    console.error('Error:', error);
    // エラー追跡サービスに送信（Sentry など）
    // Sentry.captureException(error);
  } else {
    console.warn('Warning:', error);
  }
}
```

### エラーコンテキストの記録

```typescript
// ✅ Good: エラーコンテキストを記録
async function createDiary(data: DiaryData) {
  try {
    return await saveDiaryToDB(data);
  } catch (error) {
    logError(error, {
      function: 'createDiary',
      input: data,
      timestamp: new Date().toISOString(),
    });
    throw error;
  }
}
```

---

## エラーの回復

### 再試行パターン

```typescript
// ✅ Good: 再試行ロジック
async function retry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw new Error('Max retries exceeded');
}

// 使用例
const diary = await retry(() => getDiary(1));
```

### フォールバックパターン

```typescript
// ✅ Good: フォールバック処理
async function getDiaryWithFallback(id: number): Promise<Diary | null> {
  try {
    return await getDiary(id);
  } catch (error) {
    if (error instanceof NetworkError) {
      // ネットワークエラーの場合、キャッシュから取得
      return await getDiaryFromCache(id);
    }
    throw error;
  }
}
```

---

## ベストプラクティス

### 1. エラーの早期検出

- バリデーションを早期に実行
- 型チェックを活用

### 2. エラーメッセージの一貫性

- エラーメッセージの形式を統一
- エラーコードを定義

### 3. エラーログの適切な記録

- すべてのエラーをログに記録
- 機密情報をログに含めない

### 4. ユーザー体験の考慮

- ユーザーに分かりやすいメッセージ
- 次のアクションを示す

---

**関連ドキュメント:**
- [コーディング規約（概要）](./301_CodingStandards.md)
- [ログ記録規約](./307_Logging.md)
- [Next.js エラーハンドリング](./328_NextJS_ErrorHandling.md)

