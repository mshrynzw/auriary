# 詳細設計書：ログ・監査

## 9. ログ・監査

### 9.1 AI 利用ログ（将来実装）

**実装方式:**
- `t_ai_logs` テーブルを作成（将来実装）
- OpenAI API 呼び出しを記録
- ユーザーID、リクエスト内容、レスポンス、コストを記録

**テーブル設計（予定）:**
```sql
CREATE TABLE t_ai_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES m_users(id),
  diary_id BIGINT REFERENCES t_diaries(id),
  ai_provider TEXT NOT NULL, -- 'openai', 'cloudflare-ai', etc.
  model_name TEXT NOT NULL,
  request_type TEXT NOT NULL, -- 'complete', 'analyze', 'summarize'
  request_tokens INTEGER,
  response_tokens INTEGER,
  cost_usd NUMERIC(10, 6),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**RLS ポリシー:**
- ユーザーは自身のログのみ参照可能

### 9.2 日記更新履歴（将来実装）

**実装方式:**
- `t_diary_history` テーブルを作成（将来実装）
- 日記の更新履歴を保持
- 差分を JSON 形式で保存

**テーブル設計（予定）:**
```sql
CREATE TABLE t_diary_history (
  id BIGSERIAL PRIMARY KEY,
  diary_id BIGINT NOT NULL REFERENCES t_diaries(id),
  user_id BIGINT NOT NULL REFERENCES m_users(id),
  change_type TEXT NOT NULL, -- 'create', 'update', 'delete'
  old_values JSONB,
  new_values JSONB,
  changed_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 9.3 アクセスログ（将来実装）

**実装方式:**
- Cloudflare のアクセスログを活用
- 重要な操作（削除など）はアプリ側でも記録

### 9.4 エラーログ

**実装方式:**
- Next.js のエラーログを活用
- 本番環境では Sentry などのエラー追跡サービスを統合（将来実装）

### 9.5 監査要件

**記録すべき操作:**
- ユーザー登録・削除
- 日記の作成・更新・削除
- AI 機能の利用
- 外部アカウント連携の追加・削除
- 重要な設定変更

**保持期間:**
- ログは最低1年間保持（将来実装）
- 法的要件に応じて延長

---

**関連ドキュメント:**
- [基本設計書](./100_BasicDesign.md)
- [データベース設計](./205_DetailedDesign_Database.md)
- [セキュリティ設計](./208_DetailedDesign_08_Security.md)

