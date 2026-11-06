# 詳細設計書：セキュリティ設計

## 8. セキュリティ設計

### 8.1 所有者の条件

D1 に RLS はありません。`auth.uid()` も使いません。日記、入出金、服薬、デフォルト設定の読み書きは、セッションから取った `user_id` を SQL の条件にします。フォームやクエリで渡された `user_id` は使いません。

削除は `deleted_at` を入れるソフトデリートです。入出金の範囲置換だけは、そのユーザーの指定期間を削除してから入れ直します。

### 8.2 セッション Cookie

Cookie 名は `auriary_session` です。

- `HttpOnly`
- `SameSite=Lax`
- `Path=/`
- `Max-Age` は 30 日
- `Secure` は本番だけ。localhost の HTTP では付けない

D1 に保存するのはトークンの SHA-256 だけです。平文のトークン、パスワード、パスワードハッシュはログに出しません。

### 8.3 XSS / CSRF 対策

**XSS 対策:**
- React の自動エスケープ機能を活用
- Markdown レンダリング時は `react-markdown` などの安全なライブラリを使用
- ユーザー入力は必ずサニタイズ
- Content Security Policy（CSP）ヘッダーを設定（将来実装）

**CSRF 対策:**

- Cookie は `SameSite=Lax`
- 更新は Server Actions に寄せ、同じ処理の Route Handler を増やさない
- 削除は確認ダイアログを出す

### 8.4 認証の確認

```
1. ブラウザが Cookie auriary_session を送る
2. proxy.ts または requireAuth() がトークンを SHA-256 する
3. t_sessions に、失効しておらず期限内の行があるかを見る
4. その user_id だけで D1 を読み書きする
```

実装は `src/proxy.ts` と `src/lib/auth.ts` です。`middleware.ts` は作りません。

### 8.5 データ暗号化

**実装方針:**
- 機密情報（外部アカウントのトークンなど）は暗号化して保存
- `r_user_ext_accounts.access_token_encrypted` など
- 暗号化キーは環境変数で管理

### 8.6 レート制限（将来実装）

**実装方針:**
- API Route でレート制限を実装
- 感情分析 API 呼び出しの頻度制限
- ユーザーごとの1日あたりのリクエスト数制限

---

**関連ドキュメント:**
- [基本設計書](./100_BasicDesign.md)
- [API設計](./206_DetailedDesign_API.md)
- [データベース設計](./205_DetailedDesign_Database.md)

