# Cloudflare Workers へのデプロイ

画面と Server Actions は Next.js 16 のまま、OpenNext（`@opennextjs/cloudflare`）で Workers に載せます。データベースは D1 の binding `DB` です。AWS 向けの `open-next` パッケージは使いません。

感情分析 API は Railway のままです。この手順の対象外です。

## 現状

ローカルの D1 と、Workers 向けの設定までは入っています。遠隔の Worker と遠隔の D1 は未作成です。`wrangler.jsonc` の `database_id` はプレースホルダ `11111111-1111-4111-8111-111111111111` です。

指示があるまで、次はしません。

- Supabase のデータを消す
- 本番 D1 へ日記やユーザーを入れる
- 既存ユーザーのパスワードを移す。Supabase のパスワードハッシュは使えない

## ローカル

パッケージマネージャは pnpm 10 以降です。`pnpm-workspace.yaml` の `allowBuilds` を pnpm 9 は読めません。

```bash
pnpm install
pnpm d1:migrate:local
pnpm dev
```

`pnpm dev` は `next dev` です。`next.config.ts` の `initOpenNextCloudflareForDev()` が、wrangler のローカル D1 を binding `DB` として渡します。binding が取れない開発時だけ、`.wrangler` 配下の SQLite を直接開きます。

型の生成:

```bash
pnpm cf-typegen
```

`cloudflare-env.d.ts` は binding の名前用です。Workers のランタイム型を Next.js の型チェックへ混ぜると DOM の型が壊れるため、`tsconfig.json` には入れていません。

## 本番ビルド

```bash
pnpm preview
pnpm deploy
```

どちらも先に `opennextjs-cloudflare build` を実行します。`preview` はローカルの workerd、`deploy` は Cloudflare への公開です。

`deploy` の前に、空の遠隔 D1 を作り、`wrangler.jsonc` の `database_id` をその ID に替え、遠隔へマイグレーションを適用します。この作業はまだ行っていません。日記データの投入とは別です。

増分キャッシュ用の R2 は作りません。画面は動的で、`open-next.config.ts` のキャッシュは `dummy` です。

## Windows

この環境の Windows では、Workers 向けバンドルが完走しません。OpenNext が `node_modules` のシンボリックリンクをコピーできず、続けて `sharp` の同梱で esbuild が止まります。`next build` 自体は成功します。バンドルは WSL か、シンボリックリンクを作れる環境で実行します。

## 秘密情報

パスワード、セッション、サービスロール鍵を `NEXT_PUBLIC_` に置かない。Workers の秘密は `wrangler secret` に置く。ログに平文パスワード、パスワードハッシュ、セッショントークンを出さない。

## 以前の手順

Vercel と Supabase への手順は [800_Deploy_Vercel.md](./800_Deploy_Vercel.md) に残しています。現行のデプロイ先ではありません。
