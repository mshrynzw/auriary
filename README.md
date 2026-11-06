# auriary — AI Diary App

**Next.js 16 + Cloudflare Workers + D1 + Tailwind CSS v4 + shadcn/ui**

auriary（オーリアリー）は、**日々の記録を楽に残せる日記アプリ**です。
日記の保存時に、Railway の感情分析 API で気分のスコアを付けます。

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

- メールアドレスとパスワード
- セッションは本人の行だけを読む

### 📅 カレンダー管理

- 月/週/日ビュー切替
- フィルタリング（気分・タグ・期間）

### 📊 感情・傾向分析

- AI による sentiment / topic 分析
- 過去30日間の感情シーケンスを可視化

### ☁️ クロスデバイス同期

- D1 に保存し、ログインしたブラウザから読む
- Cloudflare Workers に載せる

## 🏗️ Tech Stack

| Category  | Technology                                                          |
| --------- | ------------------------------------------------------------------- |
| Framework | **Next.js 16**（App Router / Server Components / Server Actions）   |
| Database  | **Cloudflare D1**（SQLite）                                         |
| Hosting   | **Cloudflare Workers**（`@opennextjs/cloudflare`）                  |
| UI        | **Tailwind CSS v4**, **shadcn/ui**                                  |
| Auth      | メールとパスワード（PBKDF2、セッションの SHA-256）                  |
| AI        | 感情分析は Railway                                                  |
| Tools     | ESLint + Prettier, GitHub Actions, pnpm 10 以降                     |

---

## 📦 Project Structure

```

auriary/
├─ src/
│  ├─ app/
│  ├─ lib/
│  │  ├─ db.ts
│  │  └─ auth/
│  └─ proxy.ts
├─ migrations/
├─ wrangler.jsonc
└─ open-next.config.ts

```

---

## 🗄️ Database Schema (概要)

詳細は `migrations/0001_initial_schema.sql` と `docs/200_DetailedDesign/205_DetailedDesign_Database.md` です。

### m_users

- id（整数）
- display_name
- email
- password_hash

### t_diaries

- id
- user_id
- journal_date
- note
- mood
- ai_summary
- ai_topics

セッションの `user_id` で、本人の日記だけを読みます。

---

## 🚀 Getting Started

### 1. Clone

```bash
git clone https://github.com/yourname/auriary.git
cd auriary
```

### 2. Install

pnpm 10 以降を使います。

```bash
pnpm install
```

### 3. ローカル D1

```bash
pnpm d1:migrate:local
```

`.env.local` に感情分析 API の URL を置きます。

```text
NEXT_PUBLIC_SENTIMENT_API_URL=http://localhost:8000
```

Supabase の URL と鍵は、日記のコピーと感情分析のバックフィルだけが読みます。画面は読みません。

### 4. Dev Server

```bash
pnpm dev
```

### 5. Workers へのデプロイ

遠隔の D1 は未作成です。手順は [docs/800_Release/801_Deploy_Workers.md](./docs/800_Release/801_Deploy_Workers.md) です。本番の日記は、指示があるまで移しません。

---

## 🧪 Lint & Format

```

pnpm lint
pnpm format

```

- ESLint + Prettier を完全統合
- shadcn/ui のコードスタイルに準拠

---

## 🧪 Testing

### ユニットテスト・結合テスト（Vitest）

```bash
# ウォッチモードでテストを実行（開発用）
pnpm test

# ブラウザUIでテスト結果を確認
pnpm test:ui

# 単体テストのみ実行（CI/CD用）
pnpm test:unit

# カバレッジレポート付きでテストを実行
pnpm test:coverage

# 結合テストのみ実行
pnpm test:integration
```

### E2Eテスト（Playwright）

```bash
# E2Eテストを実行
pnpm test:e2e

# E2EテストをUIモードで実行（ブラウザで確認）
pnpm test:e2e:ui
```

**テストコマンドの違い：**

- `test`: Vitestのウォッチモード。ファイル変更を検知して自動的に再実行
- `test:ui`: VitestのUIモード。ブラウザでテスト結果を視覚的に確認
- `test:unit`: 単体テストのみを実行。結合テストは除外される。CI/CDパイプラインで使用
- `test:coverage`: コードカバレッジレポートを生成
- `test:integration`: 結合テスト。ローカルの SQLite を使う。Supabase Local は不要
- `test:e2e`: PlaywrightでE2Eテストを実行
- `test:e2e:ui`: PlaywrightのUIモードでE2Eテストを実行

---

## 🔄 CI/CD

GitHub Actionsでプッシュ時に自動的にテストが実行されます。

### CI環境での動作

GitHub Actions は Node.js 24 と pnpm 11 で、単体テスト、D1 の結合テスト、Playwright の E2E を実行します。Supabase Local は起動しません。

### テストパイプライン

`.github/workflows/test.yml` で次を実行します。

1. **単体テスト** (`pnpm test:unit`)
2. **結合テスト** (`pnpm test:integration`)
3. **E2Eテスト** (`pnpm test:e2e`)

### テスト結果の確認

- GitHubの「Actions」タブでテスト結果を確認できます
- すべてのテストが成功した場合のみ、プルリクエストがマージ可能になります
- テストが失敗した場合は、詳細なログを確認して修正してください

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
