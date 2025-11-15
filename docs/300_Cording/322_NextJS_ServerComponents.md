# 詳細設計書：React Server Components 優先原則

## React Server Components 優先原則

Next.js 16 では、**React Server Components** がデフォルトで有効化されています。本プロジェクトでは、Server Components を優先的に使用し、必要な場合のみ Client Components を使用します。

---

## 基本方針

### 1. Server Components をデフォルトで使用

**原則：**
- すべてのコンポーネントはデフォルトで Server Component
- クライアント側のインタラクションが必要な場合のみ `'use client'` を使用

**例：**
```typescript
// ✅ Good: Server Component（デフォルト）
export default async function DiaryList() {
  const supabase = createSupabaseServerClient();
  const { data: diaries } = await supabase
    .from('t_diaries')
    .select('*')
    .order('diary_date', { ascending: false });
  
  return (
    <div>
      {diaries?.map((diary) => (
        <DiaryCard key={diary.id} diary={diary} />
      ))}
    </div>
  );
}
```

### 2. Client Components の使用基準

**Client Components を使用する場合：**
- ユーザーインタラクション（onClick, onChange など）
- ブラウザ API の使用（localStorage, window など）
- React Hooks（useState, useEffect, useRef など）
- サードパーティライブラリ（Chart.js など）

**例：**
```typescript
// ⚠️ Client Component が必要な場合
'use client';

import { useState } from 'react';

export function DiaryEditor() {
  const [content, setContent] = useState('');
  
  const handleSave = async () => {
    // Server Action を呼び出し
    await saveDiary(content);
  };
  
  return (
    <div>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />
      <button onClick={handleSave}>保存</button>
    </div>
  );
}
```

---

## Islands Architecture の適用

### 原則

- ページ全体を Client Component にしない
- インタラクティブな部分のみを Client Component として分離
- Server Components と Client Components を適切に組み合わせる

### 実装パターン

```typescript
// ✅ Good: Server Component と Client Component の組み合わせ
// app/diary/page.tsx (Server Component)
import { DiaryList } from '@/components/diary/DiaryList';
import { DiaryEditor } from '@/components/diary/DiaryEditor';

export default async function DiaryPage() {
  const diaries = await getDiaries(); // Server Component でデータ取得
  
  return (
    <div>
      <DiaryList diaries={diaries} /> {/* Server Component */}
      <DiaryEditor /> {/* Client Component - インタラクションが必要 */}
    </div>
  );
}
```

---

## Server Components の利点

### 1. パフォーマンス向上

- **バンドルサイズの削減**：Client Components に送信される JavaScript が減る
- **初期ロード時間の短縮**：サーバーでレンダリング済みの HTML を送信
- **データベースクエリの最適化**：サーバー側で直接データ取得

### 2. セキュリティ向上

- **機密情報の保護**：API キーやトークンをクライアントに送信しない
- **認証情報の安全な処理**：サーバー側で認証チェック

### 3. 開発体験の向上

- **シンプルなデータフェッチ**：`async/await` を直接使用
- **型安全性**：TypeScript の型推論が効く

---

## コンポーネント設計パターン

### パターン 1: Server Component + Client Component

```typescript
// Server Component（データ取得）
export default async function DiaryDetailPage({ id }: { id: string }) {
  const diary = await getDiary(id);
  
  return (
    <div>
      <DiaryContent diary={diary} /> {/* Server Component */}
      <DiaryActions diaryId={id} /> {/* Client Component */}
    </div>
  );
}
```

### パターン 2: Server Component で認証チェック

```typescript
// Server Component（認証チェック）
export default async function ProtectedPage() {
  const supabase = createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login');
  }
  
  return <Dashboard user={user} />;
}
```

### パターン 3: Client Component で Server Action を呼び出し

```typescript
// Client Component
'use client';

import { saveDiary } from '@/app/actions';

export function SaveButton() {
  const handleSave = async () => {
    await saveDiary(); // Server Action
  };
  
  return <button onClick={handleSave}>保存</button>;
}
```

---

## 注意事項

### 1. Props の制限

- Server Components から Client Components に渡す Props は**シリアライズ可能**である必要がある
- 関数や Date オブジェクトは直接渡せない

```typescript
// ❌ Bad: 関数を直接渡す
<ClientComponent onClick={() => {}} />

// ✅ Good: Server Action を渡す
<ClientComponent onSave={saveDiary} />
```

### 2. インポートの制限

- Server Components から Client Components をインポート可能
- Client Components から Server Components をインポート不可

```typescript
// ✅ Good: Server Component から Client Component をインポート
import { ClientButton } from '@/components/ClientButton';

// ❌ Bad: Client Component から Server Component をインポート
'use client';
import { ServerComponent } from '@/components/ServerComponent'; // エラー
```

---

**関連ドキュメント:**
- [基本設計書](../100_BasicDesign/100_BasicDesign.md)
- [Next.js 16 実装方針（概要）](./321_NextJS_Implementation_Overview.md)
- [コンポーネント設計](../202_DetailedDesign/207_DetailedDesign_Components.md)

