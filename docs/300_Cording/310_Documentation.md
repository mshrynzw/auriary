# ドキュメントコメント規約

## ドキュメントコメント規約

本ドキュメントは、auriary プロジェクトにおけるドキュメントコメントの規約を定めたものです。

---

## 基本原則

### 1. 自己文書化コードを優先

- コード自体が理解しやすいように書く
- コメントは「なぜ」を説明する
- 「何を」しているかはコードで表現

### 2. 必要な箇所にコメント

- 複雑なロジックにはコメントを追加
- 公開APIにはJSDocコメントを記述
- ビジネスロジックには説明を追加

### 3. コメントの保守

- コード変更時はコメントも更新
- 古いコメントは削除

---

## JSDoc コメント

### 関数のJSDoc

```typescript
// ✅ Good: JSDoc コメント
/**
 * 日記を作成します。
 *
 * @param data - 日記データ
 * @param data.diary_date - 日記の日付（ISO8601形式）
 * @param data.note - 日記の本文
 * @returns 作成された日記
 * @throws {ValidationError} バリデーションエラー時
 * @throws {UnauthorizedError} 認証エラー時
 *
 * @example
 * ```typescript
 * const diary = await createDiary({
 *   diary_date: '2025-01-10',
 *   note: '今日の日記',
 * });
 * ```
 */
export async function createDiary(data: DiaryData): Promise<Diary> {
  // ...
}
```

### クラスのJSDoc

```typescript
// ✅ Good: クラスのJSDoc
/**
 * 日記サービスクラス。
 *
 * 日記の作成・更新・削除・取得を担当します。
 *
 * @example
 * ```typescript
 * const service = new DiaryService();
 * const diaries = await service.getDiaries();
 * ```
 */
export class DiaryService {
  /**
   * 日記一覧を取得します。
   *
   * @param userId - ユーザーID
   * @param options - 取得オプション
   * @returns 日記一覧
   */
  async getDiaries(userId: number, options?: GetDiariesOptions): Promise<Diary[]> {
    // ...
  }
}
```

### 型定義のJSDoc

```typescript
// ✅ Good: 型定義のJSDoc
/**
 * 日記データの型定義。
 *
 * @property id - 日記ID
 * @property user_id - ユーザーID
 * @property diary_date - 日記の日付
 * @property note - 日記の本文（Markdown形式）
 */
export interface Diary {
  id: number;
  user_id: number;
  diary_date: string;
  note: string | null;
}
```

---

## インラインコメント

### 複雑なロジックの説明

```typescript
// ✅ Good: 複雑なロジックにコメント
function calculateMoodScore(diary: Diary): number {
  // 感情スコアを計算
  // 各指標（睡眠の質、気分など）の平均値を計算
  // ただし、null の値は除外する
  const scores = [
    diary.sleep_quality,
    diary.wake_level,
    diary.daytime_level,
    diary.pre_sleep_level,
  ].filter((score): score is number => score !== null);

  if (scores.length === 0) {
    return 0;
  }

  return scores.reduce((sum, score) => sum + score, 0) / scores.length;
}
```

### ビジネスロジックの説明

```typescript
// ✅ Good: ビジネスロジックにコメント
function applyDiaryDefaults(diary: Diary, defaults: UserDefaults): Diary {
  // ユーザーのデフォルト設定を適用
  // 日記に値が設定されていない場合のみ、デフォルト値を適用
  // これにより、ユーザーが毎日同じ値を入力する手間を省く
  return {
    ...diary,
    sleep_quality: diary.sleep_quality ?? defaults.sleep_quality_default,
    wake_level: diary.wake_level ?? defaults.wake_level_default,
    // ...
  };
}
```

### TODO コメント

```typescript
// ✅ Good: TODO コメント
function processDiary(diary: Diary) {
  // TODO: AI分析結果をキャッシュする
  // 現在は毎回APIを呼び出しているが、同じ日記の場合は
  // キャッシュから取得するように改善する
  const analysis = await analyzeDiary(diary);
  // ...
}
```

---

## コメントの書き方

### 良いコメント

```typescript
// ✅ Good: 「なぜ」を説明
// パフォーマンスのため、日記一覧はページネーションで取得
// 一度に全件取得すると、データ量が多くなりすぎる
const diaries = await getDiaries({ page: 1, limit: 20 });

// ✅ Good: 意図を説明
// この処理は非同期で実行し、ユーザー操作をブロックしない
setTimeout(() => {
  syncDiaries();
}, 0);
```

### 悪いコメント

```typescript
// ❌ Bad: コードの繰り返し
// 日記を作成する
const diary = await createDiary(data);

// ❌ Bad: 古いコメント
// この関数は削除予定（実際にはまだ使用されている）
function oldFunction() {
  // ...
}

// ❌ Bad: 不適切なコメント
// ここはバグがあるけど動いている
function buggyFunction() {
  // ...
}
```

---

## コメントのフォーマット

### コメントのスタイル

```typescript
// ✅ Good: 単一行コメント
// 日記を保存する

// ✅ Good: 複数行コメント
// この関数は日記を作成し、
// 作成後にAI分析を実行します。

/**
 * ✅ Good: JSDoc コメント（公開API）
 * 日記を作成します。
 */
```

### コメントの位置

```typescript
// ✅ Good: コメントはコードの上に配置
// 日記を保存する
async function saveDiary(diary: Diary) {
  // ...
}

// ❌ Bad: コメントがコードの後ろ
async function saveDiary(diary: Diary) { // 日記を保存する
  // ...
}
```

---

## ドキュメント生成

### TypeDoc の使用

- JSDoc コメントからAPIドキュメントを自動生成
- 型情報も含めてドキュメント化

```bash
# ドキュメントを生成
npm run docs:generate
```

---

## ベストプラクティス

### 1. コメントの必要性

- コードが自明な場合はコメント不要
- 複雑なロジックにはコメントを追加

### 2. コメントの更新

- コード変更時はコメントも更新
- 古いコメントは削除

### 3. コメントの品質

- 明確で簡潔なコメント
- 誤字・脱字に注意

### 4. 多言語対応

- コメントは日本語で記述（プロジェクトの方針に従う）
- 必要に応じて英語も併記

---

**関連ドキュメント:**
- [コーディング規約（概要）](./301_CodingStandards.md)
- [TypeScript コーディング規約](./302_TypeScript.md)

