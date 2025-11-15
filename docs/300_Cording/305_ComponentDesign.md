# コンポーネント設計原則

## コンポーネント設計原則

本ドキュメントは、auriary プロジェクトにおけるコンポーネント設計の原則を定めたものです。フレームワークに依存しない、一般的なコンポーネント設計のベストプラクティスを定義します。

---

## 基本原則

### 1. 単一責任の原則（Single Responsibility Principle）

**1つのコンポーネントは1つの責任のみを持つ**

```typescript
// ✅ Good: 単一責任
function DiaryCard({ diary }: { diary: Diary }) {
  return (
    <div>
      <h3>{diary.title}</h3>
      <p>{diary.note}</p>
    </div>
  );
}

// ❌ Bad: 複数の責任
function DiaryCard({ diary }: { diary: Diary }) {
  // 表示 + 編集 + 削除 + API呼び出し
  const [isEditing, setIsEditing] = useState(false);
  const handleEdit = async () => { /* ... */ };
  const handleDelete = async () => { /* ... */ };
  // ...
}
```

### 2. 再利用性（Reusability）

**再利用可能な単位でコンポーネントを分割**

```typescript
// ✅ Good: 再利用可能なコンポーネント
function Button({ children, onClick, variant = 'primary' }: ButtonProps) {
  return (
    <button className={`btn btn-${variant}`} onClick={onClick}>
      {children}
    </button>
  );
}

// 使用例
<Button variant="primary" onClick={handleSave}>保存</Button>
<Button variant="secondary" onClick={handleCancel}>キャンセル</Button>
```

### 3. コンポジション（Composition）

**小さなコンポーネントを組み合わせて大きなコンポーネントを構築**

```typescript
// ✅ Good: コンポジション
function DiaryList({ diaries }: { diaries: Diary[] }) {
  return (
    <div>
      {diaries.map((diary) => (
        <DiaryCard key={diary.id} diary={diary} />
      ))}
    </div>
  );
}

function DiaryCard({ diary }: { diary: Diary }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{diary.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p>{diary.note}</p>
      </CardContent>
    </Card>
  );
}
```

---

## コンポーネントの分割基準

### 分割すべき場合

1. **コンポーネントが長すぎる（100行以上）**
2. **複数の責任を持っている**
3. **再利用可能な部分がある**
4. **テストが困難**

### 分割例

```typescript
// ❌ Bad: 長すぎるコンポーネント
function DiaryEditor() {
  // 200行以上のコード
  // 複数の責任を持っている
}

// ✅ Good: 適切に分割
function DiaryEditor() {
  return (
    <div>
      <DiaryEditorHeader />
      <DiaryEditorForm />
      <DiaryEditorActions />
    </div>
  );
}

function DiaryEditorForm() {
  // フォーム関連のロジック
}

function DiaryEditorActions() {
  // アクション関連のロジック
}
```

---

## Props の設計

### Props の原則

1. **必要最小限の Props**
2. **明確な型定義**
3. **デフォルト値の設定**
4. **オプショナル Props の適切な使用**

```typescript
// ✅ Good: 明確な Props 設計
interface DiaryCardProps {
  diary: Diary;                    // 必須
  onEdit?: (id: number) => void;    // オプション
  showActions?: boolean;            // デフォルト値あり
  variant?: 'default' | 'compact';  // 限定された値
}

function DiaryCard({
  diary,
  onEdit,
  showActions = true,
  variant = 'default',
}: DiaryCardProps) {
  // ...
}
```

### Props のバリデーション

```typescript
// ✅ Good: 型でバリデーション
interface DiaryCardProps {
  diary: Diary;  // TypeScript で型チェック
}

// ✅ Good: ランタイムバリデーション（必要に応じて）
function DiaryCard({ diary }: DiaryCardProps) {
  if (!diary.id) {
    throw new Error('Diary ID is required');
  }
  // ...
}
```

---

## 状態管理

### 状態の配置原則

1. **状態は必要最小限のスコープに配置**
2. **親コンポーネントと子コンポーネントの状態を適切に分離**
3. **共有状態は上位コンポーネントに配置**

```typescript
// ✅ Good: 状態の適切な配置
function DiaryList({ diaries }: { diaries: Diary[] }) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  
  return (
    <div>
      {diaries.map((diary) => (
        <DiaryCard
          key={diary.id}
          diary={diary}
          isSelected={diary.id === selectedId}
          onSelect={() => setSelectedId(diary.id)}
        />
      ))}
    </div>
  );
}

// ❌ Bad: 状態を不必要に上位に配置
function App() {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  // DiaryList だけで使用する状態を App に配置
}
```

---

## 副作用の管理

### 副作用の原則

1. **副作用は明確に分離**
2. **副作用の依存関係を明示**
3. **クリーンアップを適切に実装**

```typescript
// ✅ Good: 副作用の適切な管理
function DiaryList() {
  const [diaries, setDiaries] = useState<Diary[]>([]);
  
  useEffect(() => {
    async function fetchDiaries() {
      const data = await getDiaries();
      setDiaries(data);
    }
    
    fetchDiaries();
  }, []); // 依存関係を明示
  
  return (
    <div>
      {diaries.map((diary) => (
        <DiaryCard key={diary.id} diary={diary} />
      ))}
    </div>
  );
}
```

---

## パフォーマンス最適化

### メモ化の使用

```typescript
// ✅ Good: 適切なメモ化
const DiaryCard = memo(function DiaryCard({ diary }: { diary: Diary }) {
  return (
    <div>
      <h3>{diary.title}</h3>
      <p>{diary.note}</p>
    </div>
  );
});

// 使用例
function DiaryList({ diaries }: { diaries: Diary[] }) {
  return (
    <div>
      {diaries.map((diary) => (
        <DiaryCard key={diary.id} diary={diary} />
      ))}
    </div>
  );
}
```

### コールバックのメモ化

```typescript
// ✅ Good: コールバックのメモ化
function DiaryList({ diaries }: { diaries: Diary[] }) {
  const handleEdit = useCallback((id: number) => {
    // 編集処理
  }, []);
  
  return (
    <div>
      {diaries.map((diary) => (
        <DiaryCard
          key={diary.id}
          diary={diary}
          onEdit={handleEdit}
        />
      ))}
    </div>
  );
}
```

---

## エラーハンドリング

### エラー境界の使用

```typescript
// ✅ Good: エラー境界でエラーを処理
function DiaryList({ diaries }: { diaries: Diary[] }) {
  return (
    <ErrorBoundary>
      {diaries.map((diary) => (
        <DiaryCard key={diary.id} diary={diary} />
      ))}
    </ErrorBoundary>
  );
}
```

### コンポーネント内でのエラーハンドリング

```typescript
// ✅ Good: コンポーネント内でエラーを処理
function DiaryCard({ diary }: { diary: Diary }) {
  const [error, setError] = useState<string | null>(null);
  
  const handleDelete = async () => {
    try {
      await deleteDiary(diary.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'エラーが発生しました');
    }
  };
  
  if (error) {
    return <ErrorMessage message={error} />;
  }
  
  return (
    <div>
      {/* ... */}
    </div>
  );
}
```

---

## アクセシビリティ

### アクセシビリティの考慮

```typescript
// ✅ Good: アクセシビリティを考慮
function DiaryCard({ diary }: { diary: Diary }) {
  return (
    <article aria-label={`日記: ${diary.title}`}>
      <h2>{diary.title}</h2>
      <p>{diary.note}</p>
      <button
        aria-label={`${diary.title}を編集`}
        onClick={handleEdit}
      >
        編集
      </button>
    </article>
  );
}
```

---

## テスト容易性

### テストしやすいコンポーネント設計

```typescript
// ✅ Good: テストしやすい設計
function DiaryCard({ diary, onEdit }: DiaryCardProps) {
  return (
    <div data-testid="diary-card">
      <h3>{diary.title}</h3>
      <p>{diary.note}</p>
      <button
        data-testid="edit-button"
        onClick={() => onEdit?.(diary.id)}
      >
        編集
      </button>
    </div>
  );
}

// テスト例
test('DiaryCard renders correctly', () => {
  const diary = { id: 1, title: 'Test', note: 'Test note' };
  render(<DiaryCard diary={diary} />);
  expect(screen.getByTestId('diary-card')).toBeInTheDocument();
});
```

---

## ベストプラクティス

### 1. コンポーネントのサイズ

- 1つのコンポーネントは100行以内を目安
- 長すぎる場合は分割を検討

### 2. Props の数

- Props は5個以内を目安
- 多すぎる場合はオブジェクトにまとめる

### 3. ネストの深さ

- JSX のネストは3階層以内を目安
- 深すぎる場合はコンポーネントを分割

### 4. 命名の一貫性

- コンポーネント名は PascalCase
- Props 名は camelCase
- イベントハンドラーは `handle` で始める

---

**関連ドキュメント:**
- [コーディング規約（概要）](./301_CodingStandards.md)
- [TypeScript コーディング規約](./302_TypeScript.md)
- [命名規則・ファイル構造](./303_NamingConventions.md)
- [エラーハンドリング規約](./306_ErrorHandling.md)

