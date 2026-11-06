# Cloudflare Workers へのデプロイ

画面と Server Actions は Next.js 16 のまま、OpenNext（`@opennextjs/cloudflare`）で Workers に載せます。データベースは D1 の binding `DB` です。AWS 向けの `open-next` パッケージは使いません。

感情分析 API は Railway のままです。この手順の対象外です。

## 現状

空の遠隔 D1 `auriary`（リージョン APAC）と、Worker `auriary-production` は作成済みです。公開 URL は `https://auriary-production.iq87io25.workers.dev` です。`iq87io25@gmail.com` のユーザーと日記 339 件（削除済みを含む）を、ローカル D1 からコピーしてあります。入出金明細は `t_bank_transactions` にあり、公開側には直近 42 件だけ入っていたので、Supabase の 1,551 件から足りない分を足しました。いま有効な明細は 1,551 件です。同じ内容をローカル D1 にも入れました。パスワードはローカルで設定したハッシュのままです。Supabase は変更していません。

`wrangler.jsonc` のトップレベルの `database_id` はローカル用のプレースホルダです。本番の ID は `env.production` にあります。トップレベルを変えると、ローカルの SQLite ファイルが別物になります。

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

`pnpm deploy` は、ビルドのあいだだけ `getMiddlewareManifest` が null を返すようにしてから `opennextjs-cloudflare build` し、そのあと `opennextjs-cloudflare deploy --env production` を実行します。この差し替えをしないと、公開した Worker が存在しない `middleware-manifest.json` を読んで 500 になります。ビルド後に Next のファイルは元に戻します。公開先の D1 は `env.production` です。`preview` はローカルの workerd で、トップレベルのプレースホルダ ID を使います。

この Windows では、OpenNext が `node_modules` のシンボリックリンクをコピーするときに権限不足で止まります。シンボリックリンクを作れる環境でビルドしてください。画面は `next/image` を使わないため、`sharp` は `stubs/sharp` に置き換えています。ネイティブの画像変換は Workers では動きません。

増分キャッシュ用の R2 は作りません。画面は動的で、`open-next.config.ts` のキャッシュは `dummy` です。

## Windows

シンボリックリンクを作れない Windows では、Workers 向けバンドルの途中でコピーが失敗します。`next build` 自体は成功します。バンドルは、シンボリックリンクを作れる環境で実行します。

## 秘密情報

パスワード、セッション、サービスロール鍵を `NEXT_PUBLIC_` に置かない。Workers の秘密は `wrangler secret` に置く。ログに平文パスワード、パスワードハッシュ、セッショントークンを出さない。

## 以前の手順

Vercel と Supabase への手順は [800_Deploy_Vercel.md](./800_Deploy_Vercel.md) に残しています。現行のデプロイ先ではありません。
