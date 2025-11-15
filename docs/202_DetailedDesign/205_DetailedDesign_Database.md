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
- `sleep_quality`：睡眠の質（SMALLINT, 1-5, NULL）
- `wake_level`：起床時の気分（SMALLINT, 1-5, NULL）
- `daytime_level`：日中の気分（SMALLINT, 1-5, NULL）
- `pre_sleep_level`：就寝前の気分（SMALLINT, 1-5, NULL）
- `med_adherence_level`：服薬遵守度（SMALLINT, 1-5, NULL）
- `appetite_level`：食欲レベル（SMALLINT, 1-5, NULL）
- `sleep_desire_level`：睡眠欲レベル（SMALLINT, 1-5, NULL）
- `has_od`：OD発生フラグ（BOOLEAN, NULL）

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
- `sleep_quality_default`：睡眠の質デフォルト（SMALLINT, 1-5, NOT NULL）
- `wake_level_default`：目覚め時の気分デフォルト（SMALLINT, 1-5, NOT NULL）
- `daytime_level_default`：日中の気分デフォルト（SMALLINT, 1-5, NOT NULL）
- `pre_sleep_level_default`：就寝前の気分デフォルト（SMALLINT, 1-5, NOT NULL）
- `med_adherence_level_default`：服薬遵守度デフォルト（SMALLINT, 1-5, NOT NULL）
- `appetite_level_default`：食欲レベルデフォルト（SMALLINT, 1-5, NOT NULL）
- `sleep_desire_level_default`：睡眠欲レベルデフォルト（SMALLINT, 1-5, NOT NULL）

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

#### 5.3.6 その他のテーブル

- **m_medications**：薬マスタ
- **r_user_medications**：ユーザー別処方
- **r_user_ext_accounts**：外部アカウント連携（Google / LINE など）
- **t_overdoses**：OD記録
- **t_medication_intakes**：服薬実績

詳細は [205_DetailedDesign_Table_Definition.md](./205_DetailedDesign_Table_Definition.md) を参照してください。

### 5.4 Supabase 高度な機能

Supabase の高度な機能（Edge Functions、View、RLS ポリシー詳細、トリガー、ストアドプロシージャ）については、以下のドキュメントを参照してください。

→ [205_DetailedDesign_Supabase_Advanced.md](./205_DetailedDesign_Supabase_Advanced.md)

---

**関連ドキュメント:**
- [基本設計書](./100_BasicDesign.md)
- [205_DetailedDesign_ER_Diagram.md](./205_DetailedDesign_ER_Diagram.md)
- [205_DetailedDesign_Table_Definition.md](./205_DetailedDesign_Table_Definition.md)
- [205_DetailedDesign_Supabase_Advanced.md](./205_DetailedDesign_Supabase_Advanced.md)
- [セキュリティ設計](./208_DetailedDesign_08_Security.md)

