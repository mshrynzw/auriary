# auriary — AI Diary App  
**Next.js 16 + Supabase + Tailwind CSS v4 + shadcn/ui + Cloudflare**

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
- Cloudflare Pages / KV / Cache に最適化

---

## 🏗️ Tech Stack

| Category | Technology |
|---------|------------|
| Framework | **Next.js 16**（App Router / Server Components / Cache Components） |
| Database | **Supabase（PostgreSQL + RLS）** |
| Hosting | **Cloudflare Pages**（Vercel 互換ビルド） |
| UI | **Tailwind CSS v4**, **shadcn/ui**（全コンポーネント） |
| Auth | Supabase Auth |
| AI | OpenAI / ChatGPT API |
| Tools | ESLint + Prettier, GitHub Actions |

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

```

### 4. Dev Server

```

pnpm dev

```

### 5. ☁️ Hybrid Deploy Pattern 2 — Cloudflare Front + Vercel Origin（推奨）

**このパターンが推奨です。** Next.js 本体は Vercel にデプロイし、Cloudflare Workers をフロントのリバースプロキシとして利用します。OpenNext のビルドエラーを回避でき、シンプルで安定した構成です。

このパターンでは、Next.js 本体は Vercel にデプロイしつつ、Cloudflare Workers をフロントのリバースプロキシとして利用します。

**構成:**
- **Origin**: https://auriary.vercel.app （Vercel）
- **Front**: Cloudflare Workers（`cloudflare-proxy/` 以下）
- **特徴:**
  - SSR / ISR ロジックはすべて Vercel 側の Next.js に任せる
  - Cloudflare 側は非ログイン時のページや静的アセットをキャッシュして高速化
  - Supabase Auth の Cookie / Authorization ヘッダがあるリクエストはキャッシュせずにオリジンへパススルー

**デプロイ手順:**

1. **Vercel にデプロイ済みであることを確認**
   - 本番 URL: https://auriary.vercel.app

2. **Cloudflare Worker をデプロイ**
   ```bash
   pnpm install
   pnpm cf:proxy:deploy
   ```

3. **Cloudflare ダッシュボードで設定**
   - Workers & Pages → auriary-proxy を選択
   - **Routes** セクションでカスタムドメインを Worker に紐付け
     - 例: `diary.example.com/*` → `auriary-proxy` Worker
   - または、Workers の **Triggers** でルートを設定

4. **環境変数の確認**
   - `wrangler.toml` の `ORIGIN_BASE_URL` が正しい Vercel URL を指しているか確認

**キャッシュ戦略:**
- **静的アセット** (`/_next/static/*`, `/favicon.*`, `/images/*` など): 長期キャッシュ（1日）
- **非ログイン状態の HTML/JSON**: 短期キャッシュ（60秒）
- **ログイン済みユーザー**（Supabase Auth Cookie あり）: キャッシュなし（オリジンへ直接プロキシ）
- **API エンドポイント** (`/api/*`, `/supabase/*`): キャッシュなし

**開発環境でのテスト:**
```bash
pnpm cf:proxy:dev
```

**注意事項:**
- パターン2を使用する場合、Vercel 側のデプロイが正常に動作している必要があります（`https://auriary.vercel.app`）
- Cloudflare のエッジキャッシュにより、非ログイン時のページ読み込み速度が向上します
- カスタムドメイン（`www.auriaries.org` など）を Cloudflare Workers に設定する必要があります

**カスタムドメインの設定手順:**

1. Cloudflare Dashboard → Workers & Pages → **Workers** タブを選択
2. `auriary-proxy` Worker を選択
3. **Triggers** → **Routes** セクションで「Add route」をクリック
4. ルートを追加:
   - Route: `www.auriaries.org/*` または `auriaries.org/*`
   - Zone: `auriaries.org`
5. 保存

**Cloudflare Pages の無効化（オプション）:**

パターン2を使用する場合、Cloudflare Pages のプロジェクトは不要です。無効化するには：

1. Cloudflare Dashboard → Workers & Pages → **Pages** タブを選択
2. `auriary` プロジェクトを選択
3. **Settings** → 最下部の「Delete project」をクリック（または、デプロイを無効化）

### 6. Cloudflare Deploy（パターン1：OpenNext + Wrangler）⚠️ 非推奨

**注意**: このパターンは `node:timers` などのビルドエラーが発生する可能性があります。パターン2（上記）の使用を強く推奨します。

```
pnpm run build:cloudflare     # .open-next/ 以下にPages用成果物を出力
# （オプション）直接Workersへ流す場合
pnpm run deploy:cloudflare    # build → wrangler deploy まで一括
```

Cloudflare Pages ダッシュボードでの推奨設定

**推奨: OpenNext を使用する場合（バンドルサイズ最適化）**
- Build command: `pnpm install && pnpm run build:cloudflare`
- Build output directory: `.open-next`
- Compatibility flags（Settings → Runtime）: `nodejs_compat`
- **Compatibility date（Settings → Runtime）**: `2024-09-22`（重要：OpenNext が生成したコードが `node:` プレフィックスを使っていないため、2024-09-22 以前の日付が必要）
- Envs: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`（必要に応じ `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`）
- Windowsでローカルビルドする場合は **開発者モードを有効にするか WSL 上で実行** してください（Next.js がシンボリックリンクを作成するため、通常のPowerShellでは失敗します）。

**注意**: `@cloudflare/next-on-pages` はバンドルサイズが 25MB の制限を超える可能性があるため、OpenNext の使用を推奨します。

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
Lead Developer: *mshr ynzw*  
