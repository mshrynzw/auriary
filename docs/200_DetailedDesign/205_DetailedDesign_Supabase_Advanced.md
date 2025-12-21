# 詳細設計書：Supabase 高度な機能

## Supabase 高度な機能

本ドキュメントでは、Supabase の高度な機能（Edge Functions、View、RLS ポリシー詳細、トリガー、ストアドプロシージャ）の設計方針を定めます。

---

## 1. Supabase Edge Functions

### 1.1 概要

Supabase Edge Functions は、Deno ランタイム上で動作するサーバーレス関数です。バックグラウンド処理や非同期タスクの実行に使用します。

### 1.2 使用方針

**Edge Functions を使用する場合：**
- AI 処理のバックグラウンド実行（文章補完、感情分析など）
- 定期バッチ処理（日次集計、データクリーンアップなど）
- Webhook 処理（外部サービス連携）
- 重い処理の非同期実行

**Edge Functions を使用しない場合：**
- リアルタイムで必要な処理（Server Actions で実行）
- 軽量な処理（Server Components で直接実行）

### 1.3 実装予定の Edge Functions

#### 1.3.1 AI 分析処理（`analyze-diary`）

**目的：** 日記の AI 分析（感情分析、トピック抽出、要約生成）をバックグラウンドで実行

**トリガー：**
- 日記保存時に Database Webhook で呼び出し
- または Server Action から非同期で呼び出し

**実装例：**
```typescript
// supabase/functions/analyze-diary/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const { diary_id } = await req.json();
  
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
  
  // 日記本文を取得
  const { data: diary } = await supabase
    .from('t_diaries')
    .select('note')
    .eq('id', diary_id)
    .single();
  
  if (!diary?.note) {
    return new Response(JSON.stringify({ error: '日記が見つかりません' }), {
      status: 404,
    });
  }
  
  // OpenAI API を呼び出し
  const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: '日記の感情分析、トピック抽出、要約を実行してください。',
        },
        {
          role: 'user',
          content: diary.note,
        },
      ],
    }),
  });
  
  const analysis = await openaiResponse.json();
  
  // 分析結果をデータベースに保存
  await supabase
    .from('t_diaries')
    .update({
      ai_summary: analysis.summary,
      ai_topics: analysis.topics,
      mood: analysis.mood_score,
    })
    .eq('id', diary_id);
  
  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
```

#### 1.3.2 日次集計処理（`daily-aggregation`）

**目的：** 日次でユーザーの感情スコアや行動パターンを集計

**トリガー：**
- Cron ジョブ（毎日 0:00 UTC）
- Supabase Cron または外部スケジューラー

**実装例：**
```typescript
// supabase/functions/daily-aggregation/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
  
  // 過去30日間の日記を集計
  const { data: diaries } = await supabase
    .from('t_diaries')
    .select('user_id, mood, sleep_quality, diary_date')
    .gte('diary_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    .is('deleted_at', null);
  
  // ユーザーごとに集計
  const aggregations = new Map();
  
  for (const diary of diaries || []) {
    if (!aggregations.has(diary.user_id)) {
      aggregations.set(diary.user_id, {
        user_id: diary.user_id,
        avg_mood: 0,
        avg_sleep_quality: 0,
        diary_count: 0,
      });
    }
    
    const agg = aggregations.get(diary.user_id);
    if (diary.mood) {
      agg.avg_mood += diary.mood;
    }
    if (diary.sleep_quality) {
      agg.avg_sleep_quality += diary.sleep_quality;
    }
    agg.diary_count++;
  }
  
  // 集計結果を保存（将来実装：集計テーブル）
  // ...
  
  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
```

#### 1.3.3 Webhook 処理（`webhook-handler`）

**目的：** 外部サービスからの Webhook を受信・処理

**実装例：**
```typescript
// supabase/functions/webhook-handler/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

serve(async (req) => {
  const signature = req.headers.get('x-webhook-signature');
  
  // 署名検証（将来実装）
  // ...
  
  const payload = await req.json();
  
  // Webhook の種類に応じて処理
  switch (payload.type) {
    case 'user.created':
      // ユーザー作成時の処理
      break;
    case 'diary.created':
      // 日記作成時の処理
      break;
    default:
      return new Response(JSON.stringify({ error: 'Unknown webhook type' }), {
        status: 400,
      });
  }
  
  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
```

### 1.4 Edge Functions のデプロイ

**デプロイコマンド：**
```bash
# 個別の関数をデプロイ
supabase functions deploy analyze-diary

# すべての関数をデプロイ
supabase functions deploy
```

**環境変数の設定：**
```bash
supabase secrets set OPENAI_API_KEY=xxx
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=xxx
```

---

## 2. データベース View

### 2.1 概要

データベース View は、よく使用するクエリをビューとして定義し、再利用性と保守性を向上させます。

### 2.2 使用方針

**View を作成する場合：**
- 複数のテーブルを結合するクエリが頻繁に使用される
- 集計処理が複雑
- RLS ポリシーを View レベルで適用したい

**View を作成しない場合：**
- 単純な SELECT クエリ
- 一時的なクエリ

### 2.3 実装予定の View

#### 2.3.1 日記一覧 View（`v_diary_list`）

**目的：** 日記一覧表示用の View（ユーザー情報、添付ファイル数を含む）

**実装例：**
```sql
CREATE VIEW v_diary_list AS
SELECT 
  d.id,
  d.user_id,
  d.diary_date,
  d.note,
  d.sleep_quality,
  d.wake_level,
  d.daytime_level,
  d.pre_sleep_level,
  d.med_adherence_level,
  d.appetite_level,
  d.sleep_desire_level,
  d.has_od,
  d.ai_summary,
  d.ai_topics,
  d.mood,
  d.created_at,
  d.updated_at,
  u.display_name AS user_display_name,
  COUNT(da.id) AS attachment_count
FROM t_diaries d
JOIN m_users u ON d.user_id = u.id
LEFT JOIN t_diary_attachments da ON d.id = da.diary_id AND da.deleted_at IS NULL
WHERE d.deleted_at IS NULL
GROUP BY d.id, u.display_name;
```

**RLS ポリシー：**
```sql
ALTER VIEW v_diary_list SET (security_invoker = true);

CREATE POLICY "Users can view their own diary list"
ON v_diary_list FOR SELECT
USING (auth.uid() = (
  SELECT auth_user_id FROM m_users WHERE id = v_diary_list.user_id
));
```

#### 2.3.2 感情スコア集計 View（`v_mood_statistics`）

**目的：** ユーザーごとの感情スコアの統計情報を集計

**実装例：**
```sql
CREATE VIEW v_mood_statistics AS
SELECT 
  user_id,
  DATE_TRUNC('month', diary_date) AS month,
  COUNT(*) AS diary_count,
  AVG(mood) AS avg_mood,
  AVG(sleep_quality) AS avg_sleep_quality,
  AVG(wake_level) AS avg_wake_level,
  AVG(daytime_level) AS avg_daytime_level,
  AVG(pre_sleep_level) AS avg_pre_sleep_level,
  AVG(med_adherence_level) AS avg_med_adherence_level,
  AVG(appetite_level) AS avg_appetite_level,
  AVG(sleep_desire_level) AS avg_sleep_desire_level,
  COUNT(*) FILTER (WHERE has_od = true) AS od_count
FROM t_diaries
WHERE deleted_at IS NULL
  AND mood IS NOT NULL
GROUP BY user_id, DATE_TRUNC('month', diary_date);
```

#### 2.3.3 アクティブユーザー View（`v_active_users`）

**目的：** 削除されていないアクティブなユーザーのみを取得

**実装例：**
```sql
CREATE VIEW v_active_users AS
SELECT 
  id,
  auth_user_id,
  display_name,
  email,
  is_active,
  created_at,
  updated_at
FROM m_users
WHERE deleted_at IS NULL
  AND is_active = true;
```

---

## 3. RLS ポリシー詳細

### 3.1 全テーブルの RLS ポリシー設計

#### 3.1.1 m_users（ユーザーマスタ）

```sql
-- RLS を有効化
ALTER TABLE m_users ENABLE ROW LEVEL SECURITY;

-- SELECT ポリシー：自身のレコードのみ参照可能
CREATE POLICY "Users can view their own profile"
ON m_users FOR SELECT
USING (auth.uid() = auth_user_id);

-- UPDATE ポリシー：自身のレコードのみ更新可能
CREATE POLICY "Users can update their own profile"
ON m_users FOR UPDATE
USING (auth.uid() = auth_user_id)
WITH CHECK (auth.uid() = auth_user_id);

-- INSERT ポリシー：自身のレコードのみ作成可能
CREATE POLICY "Users can insert their own profile"
ON m_users FOR INSERT
WITH CHECK (auth.uid() = auth_user_id);
```

#### 3.1.2 t_diaries（日記）

```sql
-- RLS を有効化
ALTER TABLE t_diaries ENABLE ROW LEVEL SECURITY;

-- SELECT ポリシー：自身の日記のみ参照可能
CREATE POLICY "Users can view their own diaries"
ON t_diaries FOR SELECT
USING (auth.uid() = (
  SELECT auth_user_id FROM m_users WHERE id = t_diaries.user_id
));

-- INSERT ポリシー：自身の日記のみ作成可能
CREATE POLICY "Users can insert their own diaries"
ON t_diaries FOR INSERT
WITH CHECK (auth.uid() = (
  SELECT auth_user_id FROM m_users WHERE id = t_diaries.user_id
));

-- UPDATE ポリシー：自身の日記のみ更新可能
CREATE POLICY "Users can update their own diaries"
ON t_diaries FOR UPDATE
USING (auth.uid() = (
  SELECT auth_user_id FROM m_users WHERE id = t_diaries.user_id
))
WITH CHECK (auth.uid() = (
  SELECT auth_user_id FROM m_users WHERE id = t_diaries.user_id
));

-- DELETE ポリシー：ソフトデリート（UPDATE で deleted_at を設定）
CREATE POLICY "Users can delete their own diaries"
ON t_diaries FOR UPDATE
USING (auth.uid() = (
  SELECT auth_user_id FROM m_users WHERE id = t_diaries.user_id
))
WITH CHECK (auth.uid() = (
  SELECT auth_user_id FROM m_users WHERE id = t_diaries.user_id
));
```

#### 3.1.3 t_diary_attachments（日記添付）

```sql
-- RLS を有効化
ALTER TABLE t_diary_attachments ENABLE ROW LEVEL SECURITY;

-- SELECT ポリシー：自身の日記の添付ファイルのみ参照可能
CREATE POLICY "Users can view their own diary attachments"
ON t_diary_attachments FOR SELECT
USING (auth.uid() = (
  SELECT u.auth_user_id
  FROM t_diaries d
  JOIN m_users u ON d.user_id = u.id
  WHERE d.id = t_diary_attachments.diary_id
));

-- INSERT ポリシー：自身の日記の添付ファイルのみ作成可能
CREATE POLICY "Users can insert their own diary attachments"
ON t_diary_attachments FOR INSERT
WITH CHECK (auth.uid() = (
  SELECT u.auth_user_id
  FROM t_diaries d
  JOIN m_users u ON d.user_id = u.id
  WHERE d.id = t_diary_attachments.diary_id
));

-- UPDATE ポリシー：自身の日記の添付ファイルのみ更新可能
CREATE POLICY "Users can update their own diary attachments"
ON t_diary_attachments FOR UPDATE
USING (auth.uid() = (
  SELECT u.auth_user_id
  FROM t_diaries d
  JOIN m_users u ON d.user_id = u.id
  WHERE d.id = t_diary_attachments.diary_id
));

-- DELETE ポリシー：自身の日記の添付ファイルのみ削除可能
CREATE POLICY "Users can delete their own diary attachments"
ON t_diary_attachments FOR UPDATE
USING (auth.uid() = (
  SELECT u.auth_user_id
  FROM t_diaries d
  JOIN m_users u ON d.user_id = u.id
  WHERE d.id = t_diary_attachments.diary_id
));
```

#### 3.1.4 m_user_daily_defaults（日記デフォルト設定）

```sql
-- RLS を有効化
ALTER TABLE m_user_daily_defaults ENABLE ROW LEVEL SECURITY;

-- SELECT ポリシー：自身の設定のみ参照可能
CREATE POLICY "Users can view their own defaults"
ON m_user_daily_defaults FOR SELECT
USING (auth.uid() = (
  SELECT auth_user_id FROM m_users WHERE id = m_user_daily_defaults.user_id
));

-- INSERT ポリシー：自身の設定のみ作成可能
CREATE POLICY "Users can insert their own defaults"
ON m_user_daily_defaults FOR INSERT
WITH CHECK (auth.uid() = (
  SELECT auth_user_id FROM m_users WHERE id = m_user_daily_defaults.user_id
));

-- UPDATE ポリシー：自身の設定のみ更新可能
CREATE POLICY "Users can update their own defaults"
ON m_user_daily_defaults FOR UPDATE
USING (auth.uid() = (
  SELECT auth_user_id FROM m_users WHERE id = m_user_daily_defaults.user_id
));
```

### 3.2 RLS ポリシーのテスト方針

**テスト項目：**
- 自身のデータは参照・更新・削除可能
- 他ユーザーのデータは参照・更新・削除不可
- 認証されていないユーザーはアクセス不可

**テスト例：**
```sql
-- テスト用ユーザーでログイン
SET ROLE authenticated;
SET request.jwt.claim.sub = 'user-uuid-1';

-- 自身のデータは参照可能
SELECT * FROM t_diaries WHERE user_id = 1; -- OK

-- 他ユーザーのデータは参照不可
SELECT * FROM t_diaries WHERE user_id = 2; -- エラーまたは空の結果
```

---

## 4. トリガー（Triggers）

### 4.1 概要

トリガーは、データベースイベント（INSERT、UPDATE、DELETE）に応じて自動的に実行される関数です。

### 4.2 実装予定のトリガー

#### 4.2.1 updated_at 自動更新トリガー

**目的：** レコード更新時に `updated_at` を自動更新

**実装例：**
```sql
-- 関数を作成
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- トリガーを各テーブルに適用
CREATE TRIGGER update_m_users_updated_at
  BEFORE UPDATE ON m_users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_t_diaries_updated_at
  BEFORE UPDATE ON t_diaries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 他のテーブルにも同様に適用
```

#### 4.2.2 created_by / updated_by 自動設定トリガー

**目的：** レコード作成・更新時に `created_by` / `updated_by` を自動設定

**実装例：**
```sql
-- 関数を作成
CREATE OR REPLACE FUNCTION set_audit_columns()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.created_by = auth.uid();
    NEW.updated_by = auth.uid();
  ELSIF TG_OP = 'UPDATE' THEN
    NEW.updated_by = auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- トリガーを適用
CREATE TRIGGER set_m_users_audit_columns
  BEFORE INSERT OR UPDATE ON m_users
  FOR EACH ROW
  EXECUTE FUNCTION set_audit_columns();
```

#### 4.2.3 日記作成時のデフォルト値設定トリガー

**目的：** 日記作成時に、ユーザーのデフォルト設定を自動適用

**実装例：**
```sql
-- 関数を作成
CREATE OR REPLACE FUNCTION apply_diary_defaults()
RETURNS TRIGGER AS $$
DECLARE
  defaults_record m_user_daily_defaults%ROWTYPE;
BEGIN
  -- ユーザーのデフォルト設定を取得
  SELECT * INTO defaults_record
  FROM m_user_daily_defaults
  WHERE user_id = NEW.user_id
    AND deleted_at IS NULL
  LIMIT 1;
  
  -- デフォルト値を適用（NULL の場合のみ）
  IF defaults_record IS NOT NULL THEN
    NEW.sleep_quality := COALESCE(NEW.sleep_quality, defaults_record.sleep_quality_default);
    NEW.wake_level := COALESCE(NEW.wake_level, defaults_record.wake_level_default);
    NEW.daytime_level := COALESCE(NEW.daytime_level, defaults_record.daytime_level_default);
    NEW.pre_sleep_level := COALESCE(NEW.pre_sleep_level, defaults_record.pre_sleep_level_default);
    NEW.med_adherence_level := COALESCE(NEW.med_adherence_level, defaults_record.med_adherence_level_default);
    NEW.appetite_level := COALESCE(NEW.appetite_level, defaults_record.appetite_level_default);
    NEW.sleep_desire_level := COALESCE(NEW.sleep_desire_level, defaults_record.sleep_desire_level_default);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- トリガーを適用
CREATE TRIGGER apply_diary_defaults_trigger
  BEFORE INSERT ON t_diaries
  FOR EACH ROW
  EXECUTE FUNCTION apply_diary_defaults();
```

---

## 5. ストアドプロシージャ（Stored Procedures）

### 5.1 概要

ストアドプロシージャは、データベース内で定義された関数で、複雑な処理を実行します。

### 5.2 実装予定のストアドプロシージャ

#### 5.2.1 日記統計取得関数（`get_diary_statistics`）

**目的：** ユーザーの日記統計情報を取得

**実装例：**
```sql
CREATE OR REPLACE FUNCTION get_diary_statistics(
  p_user_id BIGINT,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE (
  total_count BIGINT,
  avg_mood NUMERIC,
  avg_sleep_quality NUMERIC,
  od_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT AS total_count,
    AVG(mood) AS avg_mood,
    AVG(sleep_quality) AS avg_sleep_quality,
    COUNT(*) FILTER (WHERE has_od = true)::BIGINT AS od_count
  FROM t_diaries
  WHERE user_id = p_user_id
    AND diary_date BETWEEN p_start_date AND p_end_date
    AND deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### 5.2.2 ユーザー論理削除関数（`soft_delete_user`）

**目的：** ユーザーと関連データを論理削除

**実装例：**
```sql
CREATE OR REPLACE FUNCTION soft_delete_user(p_user_id BIGINT)
RETURNS VOID AS $$
DECLARE
  v_auth_user_id UUID;
BEGIN
  -- ユーザーの auth_user_id を取得
  SELECT auth_user_id INTO v_auth_user_id
  FROM m_users
  WHERE id = p_user_id;
  
  -- 認証チェック
  IF auth.uid() != v_auth_user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  
  -- 関連データを論理削除
  UPDATE t_diaries
  SET deleted_at = NOW(), deleted_by = auth.uid()
  WHERE user_id = p_user_id AND deleted_at IS NULL;
  
  UPDATE t_diary_attachments
  SET deleted_at = NOW(), deleted_by = auth.uid()
  WHERE diary_id IN (
    SELECT id FROM t_diaries WHERE user_id = p_user_id
  ) AND deleted_at IS NULL;
  
  -- ユーザーを論理削除
  UPDATE m_users
  SET deleted_at = NOW(), deleted_by = auth.uid(), is_active = false
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 6. マテリアライズドビュー（将来実装）

### 6.1 概要

マテリアライズドビューは、ビューの結果を物理的に保存し、パフォーマンスを向上させます。

### 6.2 使用方針

**マテリアライズドビューを使用する場合：**
- 集計処理が重い
- リアルタイム性が不要
- 定期的に更新すれば十分

**実装例（将来）：**
```sql
-- 月次統計のマテリアライズドビュー
CREATE MATERIALIZED VIEW mv_monthly_statistics AS
SELECT 
  user_id,
  DATE_TRUNC('month', diary_date) AS month,
  COUNT(*) AS diary_count,
  AVG(mood) AS avg_mood,
  AVG(sleep_quality) AS avg_sleep_quality
FROM t_diaries
WHERE deleted_at IS NULL
GROUP BY user_id, DATE_TRUNC('month', diary_date);

-- インデックスを作成
CREATE INDEX idx_mv_monthly_statistics_user_month
ON mv_monthly_statistics(user_id, month);

-- 定期更新（Cron ジョブまたは Edge Function）
REFRESH MATERIALIZED VIEW mv_monthly_statistics;
```

---

## 7. ベストプラクティス

### 7.1 Edge Functions

- エラーハンドリングを適切に実装
- タイムアウトを考慮（デフォルト 60 秒）
- 環境変数で機密情報を管理
- ログを適切に記録

### 7.2 View

- パフォーマンスを考慮（インデックスの活用）
- RLS ポリシーを View レベルで適用
- 複雑な View は分割を検討

### 7.3 RLS ポリシー

- すべてのテーブルに RLS を有効化
- ポリシーは最小権限の原則に従う
- 定期的にポリシーをテスト

### 7.4 トリガー

- トリガーの実行順序を考慮
- 無限ループを避ける
- パフォーマンスへの影響を考慮

### 7.5 ストアドプロシージャ

- `SECURITY DEFINER` を使用する場合は注意
- エラーハンドリングを実装
- トランザクション管理を適切に行う

---

**関連ドキュメント:**
- [基本設計書](./100_BasicDesign.md)
- [データベース設計](./205_DetailedDesign_Database.md)
- [セキュリティ設計](./208_DetailedDesign_Security.md)
- [ER図](./205_DetailedDesign_ER_Diagram.md)
- [テーブル定義書](./205_DetailedDesign_Table_Definition.md)

