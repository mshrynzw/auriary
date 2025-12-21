# 詳細設計書：コンポーネント設計

## 7. コンポーネント設計

### 7.1 UI コンポーネント一覧（shadcn/ui）

**現在実装済み（50+ コンポーネント）:**

| コンポーネント | 用途 |
|--------------|------|
| `Button` | ボタン |
| `Card` | カード表示 |
| `Input` | テキスト入力 |
| `Textarea` | 複数行入力 |
| `Select` | セレクトボックス |
| `Calendar` | カレンダー |
| `Table` | テーブル |
| `Dialog` | モーダルダイアログ |
| `Tabs` | タブ切替 |
| `Badge` | バッジ表示 |
| `Form` | フォーム（react-hook-form 統合） |
| `Chart` | グラフ（recharts 統合） |
| `Sidebar` | サイドバー |
| `Toast` | トースト通知（sonner） |
| `Skeleton` | ローディングスケルトン |
| `Alert` | アラート表示 |
| `Avatar` | アバター表示 |
| `Checkbox` | チェックボックス |
| `RadioGroup` | ラジオボタングループ |
| `Switch` | トグルスイッチ |
| `Slider` | スライダー |
| `Progress` | プログレスバー |
| `Spinner` | スピナー |
| その他 25+ コンポーネント | ... |

### 7.2 共通コンポーネント（将来実装）

#### 7.2.1 Header

**用途:** アプリ全体のヘッダー  
**実装場所:** `src/components/layout/Header.tsx`

**機能:**
- ログイン状態表示
- ナビゲーションメニュー
- ユーザーメニュー（ドロップダウン）

**使用コンポーネント:**
- `Avatar`（ユーザーアイコン）
- `DropdownMenu`（ユーザーメニュー）
- `NavigationMenu`（ナビゲーション）

#### 7.2.2 Sidebar

**用途:** ダッシュボードのサイドバー  
**実装場所:** `src/components/layout/Sidebar.tsx`

**機能:**
- メニュー一覧
- 日記一覧へのリンク
- カレンダーへのリンク
- 分析画面へのリンク

**使用コンポーネント:**
- `Sidebar`（shadcn/ui）
- `NavigationMenu`

### 7.3 Domain Components（将来実装）

#### 7.3.1 DiaryEditor

**用途:** 日記編集エディタ  
**実装場所:** `src/components/diary/DiaryEditor.tsx`

**機能:**
- リッチテキストエディタ（TipTap 統合予定）
- AI 補完ボタン
- 保存ボタン
- タグ入力

**使用コンポーネント:**
- `Textarea`（一時的に、将来は TipTap）
- `Button`（保存・AI 補完）
- `Input`（タグ入力）

#### 7.3.2 DiaryCard

**用途:** 日記カード表示  
**実装場所:** `src/components/diary/DiaryCard.tsx`

**機能:**
- 日記のプレビュー表示
- タグ表示
- 感情スコア表示
- クリックで詳細画面へ遷移

**使用コンポーネント:**
- `Card`
- `Badge`（タグ・感情スコア）
- `Button`（詳細表示）

#### 7.3.3 EmotionChart

**用途:** 感情分析グラフ  
**実装場所:** `src/components/analytics/EmotionChart.tsx`

**機能:**
- 過去30日間の感情シーケンスを可視化
- 折れ線グラフ表示

**使用コンポーネント:**
- `Chart`（recharts）

#### 7.3.4 DiaryList

**用途:** 日記一覧表示  
**実装場所:** `src/components/diary/DiaryList.tsx`

**機能:**
- 日記一覧の表示
- フィルタリング
- ページネーション

**使用コンポーネント:**
- `Table` または `Card`（表示モード切替）
- `Pagination`
- `Select`（フィルタ）

### 7.4 コンポーネント階層構造

```
app/
├── layout.tsx
│   └── Header
│   └── Sidebar
│   └── {children}
│
diary/
├── page.tsx
│   └── DiaryList
│       └── DiaryCard[]
│
├── [id]/
│   └── page.tsx
│       └── DiaryCard
│       └── EmotionChart
│
└── new/
    └── page.tsx
        └── DiaryEditor
```

---

**関連ドキュメント:**
- [基本設計書](./100_BasicDesign.md)
- [画面一覧](./203_DetailedDesign_UI.md)

