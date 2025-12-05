# 詳細設計書：データベース設計

## 5. データベース設計

### 5.1 ER図

詳細な ER 図は以下のドキュメントを参照してください。

→ [205_DetailedDesign_ER_Diagram.md](./205_DetailedDesign_ER_Diagram.md)

### 5.2 テーブル定義

全テーブルの詳細な定義は以下のドキュメントを参照してください。

→ [205_DetailedDesign_Table_Definition.md](./205_DetailedDesign_Table_Definition.md)

### 5.3 主要テーブル概要

#### 5.3.1 m_users（ユーザーマスタ）

Supabase の `auth.users` と紐づくアプリ側ユーザーマスタ。

**主要カラム:**
- `id`：アプリ内で一意となるユーザーID（BIGINT, PK）
- `auth_user_id`：Supabase `auth.users.id`（UUID）
- `display_name`：表示名（TEXT, NOT NULL）
- `email`：メールアドレス（TEXT, NULL）
- `is_active`：有効フラグ（BOOLEAN, NOT NULL）

**RLS ポリシー:**
- ユーザーは自身のレコードのみ参照・更新可能

#### 5.3.2 t_diaries（日記・日次記録）

1日単位での睡眠・入浴・気分・服薬・日記本文を記録するメイントランザクションテーブル。

**主要カラム:**
- `id`：日記ID（BIGINT, PK）
- `user_id`：ユーザーID（BIGINT, FK → m_users.id）
- `diary_date`：記録対象日（DATE, NOT NULL）
- `note`：日記本文（Markdown）（TEXT, NULL）
- `sleep_quality`：睡眠の質（SMALLINT, 0-10, NULL）
- `wake_level`：起床時の気分（SMALLINT, 0-10, NULL）
- `daytime_level`：日中の気分（SMALLINT, 0-10, NULL）
- `pre_sleep_level`：就寝前の気分（SMALLINT, 0-10, NULL）
- `med_adherence_level`：服薬遵守度（SMALLINT, 0-10, NULL）
- `appetite_level`：食欲レベル（SMALLINT, 0-10, NULL）
- `sleep_desire_level`：睡眠欲レベル（SMALLINT, 0-10, NULL）
- `exercise_level`：運動レベル（SMALLINT, 0-10, NULL）
- `has_od`：OD発生フラグ（BOOLEAN, NULL）
- `od_times`：OD情報配列（JSONB, NULL）
  - 各ODの時刻・薬情報・量・単位・メモを配列で保持
  - 各要素は `{occurred_at, medication_id, medication_name, amount, amount_unit, context_memo, source_id}` の形式

**将来拡張:**
- `ai_summary`：AI 生成要約（TEXT, NULL）
- `ai_topics`：AI 抽出トピック（JSON, NULL）
- `mood`：感情スコア（SMALLINT, 1-5, NULL）

**RLS ポリシー:**
- ユーザーは自身の日記のみ参照・作成・更新・削除可能

#### 5.3.3 t_diary_attachments（日記添付）

`t_diaries` に紐づく画像・動画などの添付ファイルの情報を管理。

**主要カラム:**
- `id`：日記添付ID（BIGINT, PK）
- `diary_id`：日記ID（BIGINT, FK → t_diaries.id）
- `file_path`：ファイルパス（Supabase Storage）（TEXT, NOT NULL）
- `file_type`：ファイル種別（TEXT, NOT NULL）
- `file_size`：ファイルサイズ（BIGINT, NULL）
- `thumbnail_path`：サムネイルファイルパス（TEXT, NULL）

#### 5.3.4 m_user_daily_defaults（日記のデフォルト設定）

ユーザーごとに、「日記を書かなかった日」に使うデフォルト値を保存するマスタ。

**主要カラム:**
- `id`：日々デフォルトID（BIGINT, PK）
- `user_id`：ユーザーID（BIGINT, FK → m_users.id）
- `sleep_quality_default`：睡眠の質デフォルト（SMALLINT, 0-10, NOT NULL、デフォルト値5）
- `wake_level_default`：目覚め時の気分デフォルト（SMALLINT, 0-10, NOT NULL、デフォルト値5）
- `daytime_level_default`：日中の気分デフォルト（SMALLINT, 0-10, NOT NULL、デフォルト値5）
- `pre_sleep_level_default`：就寝前の気分デフォルト（SMALLINT, 0-10, NOT NULL、デフォルト値5）
- `med_adherence_level_default`：服薬遵守度デフォルト（SMALLINT, 0-10, NOT NULL、デフォルト値5）
- `appetite_level_default`：食欲レベルデフォルト（SMALLINT, 0-10, NOT NULL、デフォルト値5）
- `sleep_desire_level_default`：睡眠欲レベルデフォルト（SMALLINT, 0-10, NOT NULL、デフォルト値5）
- `exercise_level_default`：運動レベルデフォルト（SMALLINT, 0-10, NOT NULL、デフォルト値5）

#### 5.3.5 通知関連テーブル（将来実装）

**t_notifications（通知）**
- アプリ内通知を管理するテーブル
- 通知種別、タイトル、メッセージ、リンクURL、既読フラグなどを保存

**主要カラム:**
- `id`：通知ID（BIGINT, PK）
- `user_id`：ユーザーID（BIGINT, FK → m_users.id）
- `type`：通知種別（TEXT, NOT NULL）
- `title`：通知タイトル（TEXT, NOT NULL）
- `message`：通知メッセージ（TEXT, NOT NULL）
- `link_url`：リンクURL（TEXT, NULL）
- `is_read`：既読フラグ（BOOLEAN, NOT NULL）
- `created_at`：作成日時（TIMESTAMPTZ, NOT NULL）

**m_notification_settings（通知設定）**
- ユーザーごとの通知設定を管理するマスタ

**主要カラム:**
- `id`：設定ID（BIGINT, PK）
- `user_id`：ユーザーID（BIGINT, FK → m_users.id）
- `push_enabled`：プッシュ通知有効フラグ（BOOLEAN, NOT NULL）
- `email_enabled`：メール通知有効フラグ（BOOLEAN, NOT NULL）
- `push_diary_reminder`：日記リマインダー（プッシュ）（BOOLEAN, NOT NULL）
- `push_diary_missing`：日記未記入リマインダー（プッシュ）（BOOLEAN, NOT NULL）
- `email_weekly_summary`：週次サマリー（メール）（BOOLEAN, NOT NULL）
- `diary_reminder_time`：日記リマインダー時刻（TIME, NULL）
- `diary_missing_days`：日記未記入リマインダー日数（SMALLINT, NULL）

**t_push_subscriptions（プッシュ通知購読）**
- Web Push API の購読情報を管理

**主要カラム:**
- `id`：購読ID（BIGINT, PK）
- `user_id`：ユーザーID（BIGINT, FK → m_users.id）
- `subscription`：購読情報（JSONB, NOT NULL）
- `is_active`：有効フラグ（BOOLEAN, NOT NULL）
- `created_at`：作成日時（TIMESTAMPTZ, NOT NULL）

**RLS ポリシー:**
- ユーザーは自身の通知・設定・購読情報のみ参照・更新可能

#### 5.3.6 r_diary_overdoses（日記とODの関連）

`t_diaries` と `t_overdoses` を関連付けるリレーションテーブル。
1つの日記に複数のOD記録を紐付けることが可能。

**主要カラム:**
- `id`：関連ID（BIGINT, PK）
- `diary_id`：日記ID（BIGINT, FK → t_diaries.id）
- `overdose_id`：OD記録ID（BIGINT, FK → t_overdoses.id）

**RLS ポリシー:**
- ユーザーは自身の日記に関連するOD記録のみ参照・更新可能

#### 5.3.7 その他のテーブル

- **m_medications**：薬マスタ
- **r_user_medications**：ユーザー別処方
- **r_user_ext_accounts**：外部アカウント連携（Google / LINE など）
- **t_overdoses**：OD記録（時系列での詳細記録）
- **t_medication_intakes**：服薬実績

詳細は [205_DetailedDesign_Table_Definition.md](./205_DetailedDesign_Table_Definition.md) を参照してください。

### 5.4 データベース変更履歴

#### 2025-01-16: OD記録機能の追加

**変更内容:**
- `t_diaries`テーブルに`od_times`列（JSONB）を追加
  - 各ODの時刻・薬情報・量・単位・メモを配列で保持
  - 各要素は `{occurred_at, medication_id, medication_name, amount, amount_unit, context_memo, source_id}` の形式
- `r_diary_overdoses`テーブルを新規作成
  - `t_diaries`と`t_overdoses`を関連付けるリレーションテーブル
  - 将来の拡張用（現在は`od_times`で直接管理）

**マイグレーションファイル:**
- `supabase/migrations/20250116000003_add_od_times_and_relation.sql`

**実装詳細:**
- OD情報は日記テーブルに直接保存（1日単位での集約）
- 薬マスタ（`m_medications`）との紐づけをサポート
- 薬マスタにない薬は自由入力で記録可能

#### 2025-01-16: スコア範囲の変更（1-5 → 0-10）

**変更内容:**
- `t_diaries`テーブルの各レベルカラムのスコア範囲を1-5から0-10に変更
  - `sleep_quality`, `wake_level`, `daytime_level`, `pre_sleep_level`, `med_adherence_level`, `appetite_level`, `sleep_desire_level`, `exercise_level`
- `m_user_daily_defaults`テーブルの各デフォルト値カラムのスコア範囲を1-5から0-10に変更
  - デフォルト値を3から5に変更（1-5の3が0-10の5に対応）
- `t_medication_intakes`テーブルの`adherence_score`も0-10に変更
- 既存データは線形変換式 `ROUND((x - 1) * 2.5)` で変換
  - 1 → 0, 2 → 3, 3 → 5, 4 → 8, 5 → 10

**マイグレーションファイル:**
- `supabase/migrations/20250116000005_convert_level_1_5_to_0_10.sql`

**実装詳細:**
- データ更新前にCHECK制約を削除し、データ更新後に新しい制約を追加
- PostgreSQLの自動生成制約名に対応するため、動的な制約削除を実装
- スキーマ（`levelSchema`）とバリデーターも0-10に更新
- フロントエンド表示も`/5`から`/10`に変更

### 5.5 Supabase 高度な機能

Supabase の高度な機能（Edge Functions、View、RLS ポリシー詳細、トリガー、ストアドプロシージャ）については、以下のドキュメントを参照してください。

→ [205_DetailedDesign_Supabase_Advanced.md](./205_DetailedDesign_Supabase_Advanced.md)

---

**関連ドキュメント:**
- [基本設計書](./100_BasicDesign.md)
- [205_DetailedDesign_ER_Diagram.md](./205_DetailedDesign_ER_Diagram.md)
- [205_DetailedDesign_Table_Definition.md](./205_DetailedDesign_Table_Definition.md)
- [205_DetailedDesign_Supabase_Advanced.md](./205_DetailedDesign_Supabase_Advanced.md)
- [セキュリティ設計](./208_DetailedDesign_Security.md)

