# 詳細設計書：セキュリティ設計

## 8. セキュリティ設計

### 8.1 Supabase RLS ポリシー

**実装方針:**
- すべてのテーブルに RLS を有効化
- ユーザーは自身のデータのみアクセス可能

**ポリシー例（t_diaries）:**

```sql
-- SELECT ポリシー
CREATE POLICY "Users can view their own diaries"
ON t_diaries FOR SELECT
USING (auth.uid() = (
  SELECT auth_user_id FROM m_users WHERE id = t_diaries.user_id
));

-- INSERT ポリシー
CREATE POLICY "Users can insert their own diaries"
ON t_diaries FOR INSERT
WITH CHECK (auth.uid() = (
  SELECT auth_user_id FROM m_users WHERE id = t_diaries.user_id
));

-- UPDATE ポリシー
CREATE POLICY "Users can update their own diaries"
ON t_diaries FOR UPDATE
USING (auth.uid() = (
  SELECT auth_user_id FROM m_users WHERE id = t_diaries.user_id
));

-- DELETE ポリシー（ソフトデリート）
CREATE POLICY "Users can delete their own diaries"
ON t_diaries FOR UPDATE
USING (auth.uid() = (
  SELECT auth_user_id FROM m_users WHERE id = t_diaries.user_id
));
```

### 8.2 Auth Cookie

**実装方式:**
- `@supabase/ssr` を使用した Cookie ベースのセッション管理
- `HttpOnly` フラグを設定して XSS 対策
- `Secure` フラグを設定（HTTPS 環境）
- `SameSite=Strict` を設定して CSRF 対策

**Cookie 設定例:**
```typescript
{
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 60 * 60 * 24 * 7, // 7日
  path: '/',
}
```

### 8.3 XSS / CSRF 対策

**XSS 対策:**
- React の自動エスケープ機能を活用
- Markdown レンダリング時は `react-markdown` などの安全なライブラリを使用
- ユーザー入力は必ずサニタイズ
- Content Security Policy（CSP）ヘッダーを設定（将来実装）

**CSRF 対策:**
- SameSite Cookie を設定
- API Route で CSRF トークン検証（将来実装）
- 重要な操作（削除など）は確認ダイアログを表示

### 8.4 API 認証フロー

**フロー:**
```
1. クライアントが API Route にリクエスト
2. Server Component / Route Handler でセッション検証
3. createSupabaseServerClient() でセッション取得
4. セッションが有効な場合のみ処理実行
5. RLS ポリシーで自動的にユーザースコープを適用
```

**認証チェック例:**
```typescript
// src/app/api/diaries/route.ts
import { createSupabaseServerClient } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return NextResponse.json(
      { error: { code: 'UNAUTHORIZED', message: '認証が必要です' } },
      { status: 401 }
    );
  }
  
  // 認証済みユーザーのみ処理続行
  // ...
}
```

### 8.5 データ暗号化

**実装方針:**
- 機密情報（外部アカウントのトークンなど）は暗号化して保存
- `r_user_ext_accounts.access_token_encrypted` など
- 暗号化キーは環境変数で管理

### 8.6 レート制限（将来実装）

**実装方針:**
- API Route でレート制限を実装
- OpenAI API 呼び出しの頻度制限
- ユーザーごとの1日あたりのリクエスト数制限

---

**関連ドキュメント:**
- [基本設計書](./100_BasicDesign.md)
- [API設計](./206_DetailedDesign_API.md)
- [データベース設計](./205_DetailedDesign_Database.md)

