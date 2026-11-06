# 認証

メールアドレスとパスワードだけを使います。Supabase Auth と `@supabase/ssr` は使いません。

## 1. 構成

| 役割 | 場所 |
| --- | --- |
| パスワードのハッシュと照合 | `src/lib/auth/password.ts` |
| メールの正規化 | `src/lib/auth/email.ts` |
| セッションの発行、検証、失効 | `src/lib/auth/session.ts` |
| 登録とログイン | `src/lib/auth/accounts.ts` |
| Cookie を読む | `src/lib/auth.ts` |
| ログイン、登録、ログアウト | `src/app/actions/auth.ts` |
| ルート保護 | `src/proxy.ts` |

`middleware.ts` は作りません。

## 2. パスワード

Workers の Web Crypto で PBKDF2-SHA-256、反復回数 100000 です。保存形式は次のとおりです。

```text
pbkdf2-sha256$<反復回数>$<salt の 16 進>$<ハッシュの 16 進>
```

salt は毎回変えます。平文とハッシュはログに出しません。ユーザーがいないときも、同じ回数の PBKDF2 を一度走らせて、有無で応答時間を分けないようにします。

## 3. セッション

1. 32 バイトの乱数を作る
2. Cookie `auriary_session` にその値を入れる
3. SHA-256 の 16 進 64 文字だけを `t_sessions.token_hash` に保存する

Cookie の属性は `HttpOnly`、`SameSite=Lax`、`Path=/`、`Max-Age` は 30 日です。`Secure` は `NODE_ENV` が `production` のときだけ付けます。localhost の HTTP では `Secure` の Cookie が保存されないためです。

検証は、提示されたトークンをハッシュし、`revoked_at` が空で `expires_at` が未来の行を探します。ログアウトはその行の `revoked_at` を入れ、Cookie を空にします。

## 4. ルート

未ログインでは次を `/login` へ送ります。

- `/calendar`
- `/analytics`
- `/settings`
- `/blood-pressure`
- `/diary/new`
- `/diary/:id/edit`

ログイン済みが `/login` または `/register` を開くと `/diary` へ送ります。`/diary` と `/dashboard` は未ログインでも開けます。

保護されたページの Server Component は `requireAuth()` を呼びます。セッションが無ければ `/login` へ送ります。

## 5. データの範囲

D1 に RLS はありません。日記などの読み書きは、このセッションの `user_id` を SQL の条件にします。リクエストに含まれる `user_id` は使いません。
