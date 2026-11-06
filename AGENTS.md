# AGENTS.md

auriary（日記アプリ）の実装ガイド。詳細は `docs/` にあり、索引は `docs/@README.md`。このファイルは着手時の判断順と、文書より新しい決定だけを書く。

## 判断の優先順

1. ユーザーの直近の指示
2. このファイルの「現在の移行」
3. `src/` の既存実装
4. `docs/` と `README.md`

`docs/` と `README.md` のうち、アーキテクチャ、認証、データベース、セキュリティ、デプロイは Workers + D1 に合わせて更新済みです。`docs/300_Cording/` の一部と `205_DetailedDesign_Supabase_Advanced.md` には、旧 Supabase の例が残っています。そこは現行の実装説明ではありません。

## 現在の移行

目標は Cloudflare Workers + D1。画面と Server Actions は Next.js 16 のまま残し、OpenNext（`@opennextjs/cloudflare`）で Workers に載せる。既存の `open-next` パッケージは AWS 向けなので、これには使わない。

認証は作り直す。Supabase Auth は使わない。

- メールとパスワードのみ
- パスワードは Workers の Web Crypto（PBKDF2）でハッシュする
- セッションは乱数トークンを Cookie に載せる。属性は `HttpOnly`、`Secure`、`SameSite=Lax`
- D1 にはトークンの SHA-256 だけを保存する
- 平文パスワード、ハッシュ、セッショントークンをログに出さない

D1 に RLS はない。すべての読み書きで、セッションの `user_id` を条件にする。クライアントから渡された `user_id` は信用しない。

SQLite に合わせる。`BIGSERIAL` は整数の主キー、日時と JSON は TEXT、`updated_at` はアプリ側で更新する。PostgreSQL のトリガー、RLS、`auth.uid()` は移植しない。`m_users.auth_user_id` は廃止し、ユーザー行に `email` と `password_hash` を持たせる。

感情分析 API は Railway のままにする。この移行の対象外。

アプリの画面と Server Actions は D1 の binding `DB` を使う。`next dev` では OpenNext がローカル D1 をその binding に載せる。binding が無い開発時だけ、`.wrangler` の SQLite を直接開く。`src/lib/supabase.ts` は廃止した。Supabase を読むのは、日記コピーと感情分析のバックフィルスクリプトだけ。

本番データの移行は未決定。指示があるまで Supabase のデータを消す操作、本番 D1 への投入、既存ユーザーのパスワード移行をしない。Supabase のパスワードハッシュは取り出せない前提で扱う。遠隔 D1 は未作成で、`wrangler.jsonc` の `database_id` はプレースホルダのまま。

作業順は次のとおり。

1. D1 スキーマとセッションの発行・検証
2. ログイン、登録、ログアウト、`src/proxy.ts` のルート保護
3. Server Actions（日記、入出金、服薬、デフォルト設定、AI）を D1 に置き換え
4. OpenNext で Workers にデプロイし、Supabase クライアントを外す
5. 無効になった設計書（アーキテクチャ、認証、データベース、セキュリティ、デプロイ）を更新する。この5つは更新済み。遠隔の D1 作成と本番データの投入は、別の指示までしない。

## 守る実装

- ルート保護は `src/proxy.ts`。`middleware.ts` は作らない。
- データ更新は Server Actions。Route Handler を増やして同じ処理を二重にしない。
- 入力は `src/schemas/` の Zod で検証する。テーブル行は `schemas/tables/`、入力は `schemas/forms/`。
- `cookies()`、`headers()`、`searchParams` は Next.js 16 では await する。
- Server Components を既定にする。`use client` はイベント、ブラウザ API、表示状態が必要なコンポーネントだけ。
- 削除は既存どおり `deleted_at` のソフトデリート。
- `any` を増やさない。未知の値は `unknown` にする。
- 秘密情報をクライアントに渡さない。`NEXT_PUBLIC_` は公開してよい値だけ。

## このリポジトリの書き方

パッケージマネージャは pnpm 10 以降。`pnpm-workspace.yaml` の `allowBuilds` を pnpm 9 は読めない。

Prettier（`.cursor/settings.json`）: シングルクォート、セミコロンあり、trailing comma は es5、幅 100、インデント 2、LF。

ファイル名は `src/` の既存に合わせる。ページとコンポーネントは kebab-case（例: `diary-list.tsx`）。設計書 `303_NamingConventions.md` の PascalCase ファイル名は、このリポジトリでは採用しない。

コミットメッセージは Conventional Commits、件名は日本語。例: `feat(auth): セッションを D1 に保存する`。コミットはユーザーが頼んだときだけ作る。

## コマンド

- 開発: `pnpm dev`
- リント: `pnpm lint`（`next lint` は使わない）
- 型: `pnpm types`
- 単体: `pnpm test:unit`
- 結合: `pnpm test:integration`（ローカルの SQLite。Supabase Local は不要）
- E2E: `pnpm test:e2e`

変更した層のテストを更新する。認証とクエリの所有者チェックは、実装と一緒にテストする。

## 読む場所

着手前に `docs/@README.md` で該当文書を選ぶ。全体を読み直さない。

| 作業 | 文書 |
| --- | --- |
| 画面 | `docs/200_DetailedDesign/203_DetailedDesign_UI.md` |
| 機能 | `docs/200_DetailedDesign/204_DetailedDesign_Functions.md` |
| テーブル | `docs/200_DetailedDesign/205_DetailedDesign_Table_Definition.md` |
| Server Actions | `docs/300_Cording/325_NextJS_ServerActions.md` |
| エラー | `docs/300_Cording/306_ErrorHandling.md`、`328_NextJS_ErrorHandling.md` |
| テスト | `docs/500_Unit_Test/500_Strategy.md`、`600_Integration_Test/600_Strategy.md`、`700_E2E_Test/700Strategy.md` |
| デプロイ | `docs/800_Release/801_Deploy_Workers.md` |

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
