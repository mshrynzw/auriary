# auriary — AI Diary App

**Next.js 16 + Supabase + Tailwind CSS v4 + shadcn/ui**

auriary（オーリアリー）は、**日々の記録を楽に・幻想的に残せる次世代の日記アプリ**です。  
ChatGPT とリアルタイム連携し、文章補助・感情分析・タグ自動生成などを自動化します。

<img width="1093" height="870" alt="image" src="https://github.com/user-attachments/assets/7dcc19da-f407-4e86-957c-d134f8ee1f96" />

<img width="1093" height="1320" alt="image" src="https://github.com/user-attachments/assets/6550f5af-b5af-4077-95c6-a9a57db60ab1" />

<img width="378" height="820" alt="image" src="https://github.com/user-attachments/assets/e09e8f23-54b8-40e2-add0-94f97b841b54" />

---

## 🌟 Features

### ✏️ スマート日記作成

- リッチテキストエディタ（shadcn/ui + TipTap）
- AI による文章補完・推敲
- 自動タグ / 自動カテゴリ分類

### 🔐 セキュア認証

- Supabase Auth（Email / OAuth）
- RLS（Row Level Security）対応

### 📅 カレンダー管理

- 月/週/日ビュー切替
- フィルタリング（気分・タグ・期間）

### 📊 感情・傾向分析

- AI による sentiment / topic 分析
- 過去30日間の感情シーケンスを可視化

### ☁️ クロスデバイス同期

- Supabase を利用したリアルタイム同期
- Vercel のエッジネットワークで高速化

---

## 🏗️ Tech Stack

| Category  | Technology                                                          |
| --------- | ------------------------------------------------------------------- |
| Framework | **Next.js 16**（App Router / Server Components / Cache Components） |
| Database  | **Supabase（PostgreSQL + RLS）**                                    |
| Hosting   | **Vercel**（Next.js 最適化）                                        |
| UI        | **Tailwind CSS v4**, **shadcn/ui**（全コンポーネント）              |
| Auth      | Supabase Auth                                                       |
| AI        | OpenAI / ChatGPT API                                                |
| Tools     | ESLint + Prettier, GitHub Actions                                   |

---

## 📦 Project Structure

```

auriary/
├─ app/
│  ├─ (dashboard)/
│  ├─ diary/
│  ├─ api/
│  └─ layout.tsx
├─ components/
├─ lib/
│  ├─ supabase.ts
│  ├─ validators/
│  └─ ai/
├─ styles/
├─ supabase/
│  ├─ migrations/
│  ├─ seeds/
│  └─ config.toml
└─ README.md

```

---

## 🗄️ Database Schema (概要)

主要テーブル（Mermaid ER 図は DB/設計資料に準拠）：

### **m_users（ユーザーマスタ）**

- id / auth_user_id（UUID）
- display_name
- email
- created_at / updated_at / deleted_at
- created_by / updated_by / deleted_by

### **t_diaries（日記）**

- id
- user_id
- title
- body
- mood（感情スコア）
- ai_summary
- ai_topics
- created_at / updated_at / deleted_at

### **t_diary_tags（タグ紐付け）**

Supabase の RLS により、ユーザー自身のみ参照可能。

---

## 🚀 Getting Started

### 1. Clone

```

git clone [https://github.com/yourname/auriary.git](https://github.com/yourname/auriary.git)
cd auriary

```

### 2. Install

```

pnpm install

```

### 3. Supabase Setup

```

supabase start
supabase db push
supabase gen types typescript --project-id "local" > lib/types/supabase.ts

```

.env.local を設定：

```

NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
OPENAI_API_KEY=...
NEXT_PUBLIC_SENTIMENT_API_URL=http://localhost:8000

```

### 4. Dev Server

```

pnpm dev

```

### 5. ☁️ Vercel へのデプロイ

**デプロイ手順:**

1. **Vercel にプロジェクトをインポート**
   - [Vercel Dashboard](https://vercel.com/dashboard) にログイン
   - 「**Add New Project**」をクリック
   - GitHubリポジトリを選択してインポート

2. **環境変数を設定**
   - Vercel Dashboard → プロジェクト → **Settings** → **Environment Variables**
   - 以下の環境変数を追加：
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

3. **デプロイ**
   - 「**Deploy**」をクリック
   - ビルドが完了すると自動的にデプロイされます

4. **完了！**
   - デプロイされたURL（例: `https://auriary.vercel.app`）からアクセス可能になります

**カスタムドメインの設定（オプション）:**

1. Vercel Dashboard → プロジェクト → **Settings** → **Domains**
2. 「**Add Domain**」をクリック
3. カスタムドメインを入力（例: `www.auriaries.org`）
4. DNS設定の指示に従って設定
   - Vercelが提供するDNSレコードをDNSプロバイダーに追加
   - SSL証明書は自動的に設定されます

**詳細な設定手順:**

詳細な設定手順については、[docs/800_Release/800_Deploy.md](./docs/800_Release/800_Deploy.md) を参照してください。

---

## 🧪 Lint & Format

```

pnpm lint
pnpm format

```

- ESLint + Prettier を完全統合
- shadcn/ui のコードスタイルに準拠

---

## 🔮 Future Plans

- モバイルアプリ（Expo / React Native）
- AI の感情スコア可視化強化
- 音声入力 → AI による自動文字起こし
- ホログラム UI（ユーザーの要望より）

---

## 📄 License

This project is licensed under the **AGPL-3.0**.  
商用利用・フォークは自由ですが、派生物の公開が必要です。

---

## 👤 Author

**auriary Project Team**  
Lead Developer: mshrynzw
