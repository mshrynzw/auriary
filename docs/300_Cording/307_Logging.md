# ログ記録規約

## ログ記録規約

本ドキュメントは、auriary プロジェクトにおけるログ記録の規約を定めたものです。

---

## 基本原則

### 1. 適切なログレベルの使用

- ログレベルを適切に使い分ける
- 本番環境では不要なログを出力しない

### 2. 構造化ログ

- ログは構造化された形式で記録
- 検索・分析が容易な形式

### 3. 機密情報の保護

- パスワード、トークンなどの機密情報をログに含めない
- 個人情報はマスキング

---

## ログレベル

### ログレベルの定義

| レベル | 用途 | 例 |
|--------|------|-----|
| `error` | エラー発生時 | 例外、API エラー |
| `warn` | 警告 | 非推奨機能の使用、パフォーマンス問題 |
| `info` | 情報 | 重要な処理の開始・終了 |
| `debug` | デバッグ情報 | 詳細な処理フロー |
| `trace` | トレース情報 | 関数の呼び出し、変数の値 |

### ログレベルの使い分け

```typescript
// ✅ Good: ログレベルを適切に使用
logger.error('日記の保存に失敗しました', { error, diaryId });
logger.warn('API レスポンスが遅いです', { duration: 5000 });
logger.info('日記を作成しました', { diaryId: diary.id });
logger.debug('日記データを検証中', { data });
```

---

## ログフォーマット

### 構造化ログ

```typescript
// ✅ Good: 構造化ログ
logger.info({
  message: '日記を作成しました',
  diaryId: diary.id,
  userId: user.id,
  timestamp: new Date().toISOString(),
  duration: 123, // ms
});

// ❌ Bad: 非構造化ログ
logger.info(`日記を作成しました: ${diary.id}`);
```

### ログフォーマットの統一

```typescript
// ✅ Good: 統一されたフォーマット
interface LogEntry {
  level: 'error' | 'warn' | 'info' | 'debug' | 'trace';
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

function log(entry: LogEntry) {
  console[entry.level](JSON.stringify(entry));
}
```

---

## ログの記録箇所

### 記録すべき箇所

1. **エラー発生時**
   - 例外のキャッチ時
   - API エラーレスポンス時

2. **重要な処理の開始・終了**
   - データベース操作
   - 外部API呼び出し
   - 認証処理

3. **パフォーマンス問題**
   - 遅い処理の検出
   - メモリ使用量の監視

### 記録例

```typescript
// ✅ Good: エラーログ
try {
  await createDiary(data);
} catch (error) {
  logger.error({
    message: '日記の作成に失敗しました',
    error: {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    },
    context: { userId: user.id, data },
  });
  throw error;
}

// ✅ Good: 処理ログ
logger.info({
  message: '日記を作成しました',
  diaryId: diary.id,
  userId: user.id,
  duration: Date.now() - startTime,
});

// ✅ Good: パフォーマンスログ
const duration = Date.now() - startTime;
if (duration > 1000) {
  logger.warn({
    message: '処理が遅いです',
    duration,
    function: 'getDiaries',
  });
}
```

---

## 機密情報の保護

### 機密情報のマスキング

```typescript
// ✅ Good: 機密情報をマスキング
function maskSensitiveData(data: Record<string, unknown>): Record<string, unknown> {
  const sensitiveKeys = ['password', 'token', 'apiKey', 'secret'];
  const masked = { ...data };
  
  for (const key of sensitiveKeys) {
    if (key in masked) {
      masked[key] = '***';
    }
  }
  
  return masked;
}

// 使用例
logger.info({
  message: 'ユーザー認証',
  user: maskSensitiveData({ id: user.id, password: user.password }),
});
```

### 個人情報の保護

```typescript
// ✅ Good: 個人情報をマスキング
function maskPersonalInfo(data: Record<string, unknown>): Record<string, unknown> {
  const personalKeys = ['email', 'phone', 'address'];
  const masked = { ...data };
  
  for (const key of personalKeys) {
    if (key in masked && typeof masked[key] === 'string') {
      const value = masked[key] as string;
      masked[key] = value.length > 4 
        ? `${value.slice(0, 2)}***${value.slice(-2)}`
        : '***';
    }
  }
  
  return masked;
}
```

---

## ログの出力先

### 開発環境

- コンソールに出力
- 詳細なデバッグ情報を表示

```typescript
// 開発環境
if (process.env.NODE_ENV === 'development') {
  logger.debug('詳細なデバッグ情報', { data });
}
```

### 本番環境

- ログファイルに出力
- エラー追跡サービスに送信（Sentry など）
- 構造化ログを JSON 形式で出力

```typescript
// 本番環境
if (process.env.NODE_ENV === 'production') {
  logger.error('エラーが発生しました', { error });
  // Sentry.captureException(error);
}
```

---

## ログの検索・分析

### 構造化ログの利点

```typescript
// ✅ Good: 検索可能な構造化ログ
logger.info({
  message: '日記を作成しました',
  action: 'diary.create',
  userId: user.id,
  diaryId: diary.id,
  timestamp: new Date().toISOString(),
});

// 検索例: action='diary.create' で検索可能
```

### ログの集計

```typescript
// ✅ Good: 集計可能なログ
logger.info({
  message: 'API リクエスト',
  method: 'POST',
  path: '/api/diaries',
  statusCode: 201,
  duration: 123,
  userId: user.id,
});

// 集計例: パスごとの平均レスポンス時間を計算可能
```

---

## ログの保持期間

### ログの保持ポリシー

- **エラーログ**: 30日間保持
- **アクセスログ**: 7日間保持
- **デバッグログ**: 1日間保持

### ログのアーカイブ

- 長期保存が必要なログはアーカイブ
- 圧縮して保存

---

## ベストプラクティス

### 1. ログの量

- 必要な情報のみをログに記録
- 過度なログは避ける

### 2. ログの一貫性

- ログフォーマットを統一
- ログレベルを適切に使用

### 3. パフォーマンス

- ログ出力がパフォーマンスに影響しないように注意
- 非同期でログを出力

### 4. セキュリティ

- 機密情報をログに含めない
- 個人情報はマスキング

---

**関連ドキュメント:**
- [コーディング規約（概要）](./301_CodingStandards.md)
- [エラーハンドリング規約](./306_ErrorHandling.md)
- [ログ・監査](../202_DetailedDesign/209_DetailedDesign_Logging.md)

