-- auriary の D1 (SQLite) 初期スキーマ。
-- supabase/migrations の最終形を、空の SQLite 向けにまとめたもの。
-- データのコピーはしない。
--
-- 移植しないもの:
--   PostgreSQL のトリガー、RLS、auth.uid()、拡張、GIN インデックス。
-- 日時は ISO 8601 の TEXT。JSON は TEXT。updated_at はアプリが更新する。
-- created_by / updated_by / deleted_by は m_users.id (INTEGER)。
-- m_users だけ created_by / updated_by を NULL 可にする。
-- 挿入後に自分の id を入れる（自己参照を INSERT 1 文では決められないため）。

-- ============================================
-- m_users（ユーザーマスタ）
-- auth_user_id は作らない。email は小文字で一意。password_hash を持つ。
-- ============================================
CREATE TABLE m_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  display_name TEXT NOT NULL,
  family_name TEXT,
  first_name TEXT,
  family_name_kana TEXT,
  first_name_kana TEXT,
  email TEXT NOT NULL UNIQUE CHECK (
    email = lower(trim(email)) AND length(trim(email)) > 0
  ),
  password_hash TEXT NOT NULL CHECK (length(password_hash) > 0),
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  source_id INTEGER,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  deleted_at TEXT,
  created_by INTEGER REFERENCES m_users(id),
  updated_by INTEGER REFERENCES m_users(id),
  deleted_by INTEGER REFERENCES m_users(id)
);

-- ============================================
-- m_user_daily_defaults（日記のデフォルト設定）
-- レベルは 0〜10、既定値は 5。時刻デフォルトは TEXT (HH:mm など)。
-- ============================================
CREATE TABLE m_user_daily_defaults (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE REFERENCES m_users(id) ON DELETE CASCADE,
  sleep_quality_default INTEGER NOT NULL DEFAULT 5 CHECK (sleep_quality_default BETWEEN 0 AND 10),
  wake_level_default INTEGER NOT NULL DEFAULT 5 CHECK (wake_level_default BETWEEN 0 AND 10),
  daytime_level_default INTEGER NOT NULL DEFAULT 5 CHECK (daytime_level_default BETWEEN 0 AND 10),
  pre_sleep_level_default INTEGER NOT NULL DEFAULT 5 CHECK (pre_sleep_level_default BETWEEN 0 AND 10),
  med_adherence_level_default INTEGER NOT NULL DEFAULT 5 CHECK (
    med_adherence_level_default BETWEEN 0 AND 10
  ),
  appetite_level_default INTEGER NOT NULL DEFAULT 5 CHECK (appetite_level_default BETWEEN 0 AND 10),
  sleep_desire_level_default INTEGER NOT NULL DEFAULT 5 CHECK (
    sleep_desire_level_default BETWEEN 0 AND 10
  ),
  exercise_level_default INTEGER NOT NULL DEFAULT 5 CHECK (exercise_level_default BETWEEN 0 AND 10),
  bipolar_self_level_default INTEGER NOT NULL DEFAULT 5 CHECK (
    bipolar_self_level_default BETWEEN 0 AND 10
  ),
  sleep_start_at_default TEXT,
  sleep_end_at_default TEXT,
  bath_start_at_default TEXT,
  bath_end_at_default TEXT,
  source_id INTEGER,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  deleted_at TEXT,
  created_by INTEGER NOT NULL REFERENCES m_users(id),
  updated_by INTEGER NOT NULL REFERENCES m_users(id),
  deleted_by INTEGER REFERENCES m_users(id)
);

-- ============================================
-- m_medications（薬マスタ）
-- ============================================
CREATE TABLE m_medications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  generic_name TEXT,
  memo TEXT,
  source_id INTEGER,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  deleted_at TEXT,
  created_by INTEGER NOT NULL REFERENCES m_users(id),
  updated_by INTEGER NOT NULL REFERENCES m_users(id),
  deleted_by INTEGER REFERENCES m_users(id)
);

-- ============================================
-- r_user_medications（ユーザー別処方）
-- ============================================
CREATE TABLE r_user_medications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES m_users(id) ON DELETE CASCADE,
  medication_id INTEGER NOT NULL REFERENCES m_medications(id) ON DELETE CASCADE,
  dosage_text TEXT,
  dose_amount REAL,
  dose_unit TEXT,
  start_date TEXT NOT NULL,
  end_date TEXT,
  is_current INTEGER NOT NULL DEFAULT 1 CHECK (is_current IN (0, 1)),
  source_id INTEGER,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  deleted_at TEXT,
  created_by INTEGER NOT NULL REFERENCES m_users(id),
  updated_by INTEGER NOT NULL REFERENCES m_users(id),
  deleted_by INTEGER REFERENCES m_users(id)
);

-- ============================================
-- r_user_ext_accounts（外部アカウント連携）
-- ============================================
CREATE TABLE r_user_ext_accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES m_users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  ext_user_id TEXT NOT NULL,
  access_token_encrypted TEXT,
  refresh_token_encrypted TEXT,
  token_expires_at TEXT,
  source_id INTEGER,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  deleted_at TEXT,
  created_by INTEGER NOT NULL REFERENCES m_users(id),
  updated_by INTEGER NOT NULL REFERENCES m_users(id),
  deleted_by INTEGER REFERENCES m_users(id),
  UNIQUE (user_id, provider, ext_user_id)
);

-- ============================================
-- t_diaries（日記・日次記録）
-- od_times / alcohol_times / ai_topics / sentiment_analysis_result は JSON 文字列。
-- ============================================
CREATE TABLE t_diaries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES m_users(id) ON DELETE CASCADE,
  journal_date TEXT NOT NULL,
  sleep_start_at TEXT,
  sleep_end_at TEXT,
  bath_start_at TEXT,
  bath_end_at TEXT,
  sleep_quality INTEGER CHECK (sleep_quality IS NULL OR (sleep_quality BETWEEN 0 AND 10)),
  wake_level INTEGER CHECK (wake_level IS NULL OR (wake_level BETWEEN 0 AND 10)),
  daytime_level INTEGER CHECK (daytime_level IS NULL OR (daytime_level BETWEEN 0 AND 10)),
  pre_sleep_level INTEGER CHECK (pre_sleep_level IS NULL OR (pre_sleep_level BETWEEN 0 AND 10)),
  med_adherence_level INTEGER CHECK (
    med_adherence_level IS NULL OR (med_adherence_level BETWEEN 0 AND 10)
  ),
  appetite_level INTEGER CHECK (appetite_level IS NULL OR (appetite_level BETWEEN 0 AND 10)),
  sleep_desire_level INTEGER CHECK (
    sleep_desire_level IS NULL OR (sleep_desire_level BETWEEN 0 AND 10)
  ),
  exercise_level INTEGER CHECK (exercise_level IS NULL OR (exercise_level BETWEEN 0 AND 10)),
  bipolar_self_level INTEGER CHECK (
    bipolar_self_level IS NULL OR (bipolar_self_level BETWEEN 0 AND 10)
  ),
  note TEXT,
  has_od INTEGER DEFAULT 0 CHECK (has_od IS NULL OR has_od IN (0, 1)),
  od_times TEXT DEFAULT '[]',
  has_alcohol INTEGER DEFAULT 0 CHECK (has_alcohol IS NULL OR has_alcohol IN (0, 1)),
  alcohol_times TEXT DEFAULT '[]',
  ai_summary TEXT,
  ai_topics TEXT,
  mood INTEGER CHECK (mood IS NULL OR (mood BETWEEN 1 AND 10)),
  sentiment_analysis_result TEXT,
  systolic INTEGER CHECK (systolic IS NULL OR (systolic BETWEEN 50 AND 250)),
  diastolic INTEGER CHECK (diastolic IS NULL OR (diastolic BETWEEN 30 AND 160)),
  pulse INTEGER CHECK (pulse IS NULL OR (pulse BETWEEN 30 AND 220)),
  source_id INTEGER,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  deleted_at TEXT,
  created_by INTEGER NOT NULL REFERENCES m_users(id),
  updated_by INTEGER NOT NULL REFERENCES m_users(id),
  deleted_by INTEGER REFERENCES m_users(id),
  UNIQUE (user_id, journal_date),
  CHECK (systolic IS NULL OR diastolic IS NULL OR systolic >= diastolic)
);

-- ============================================
-- t_diary_attachments（日記添付）
-- 設計書の diaries_id ではなく、既存 SQL / Zod の diary_id を使う。
-- ============================================
CREATE TABLE t_diary_attachments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  diary_id INTEGER NOT NULL REFERENCES t_diaries(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  thumbnail_path TEXT,
  source_id INTEGER,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  deleted_at TEXT,
  created_by INTEGER NOT NULL REFERENCES m_users(id),
  updated_by INTEGER NOT NULL REFERENCES m_users(id),
  deleted_by INTEGER REFERENCES m_users(id)
);

-- ============================================
-- t_overdoses（OD記録）
-- ============================================
CREATE TABLE t_overdoses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES m_users(id) ON DELETE CASCADE,
  occurred_at TEXT NOT NULL,
  medication_id INTEGER REFERENCES m_medications(id) ON DELETE SET NULL,
  medication_name TEXT,
  amount REAL,
  amount_unit TEXT,
  note TEXT,
  source_id INTEGER,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  deleted_at TEXT,
  created_by INTEGER NOT NULL REFERENCES m_users(id),
  updated_by INTEGER NOT NULL REFERENCES m_users(id),
  deleted_by INTEGER REFERENCES m_users(id)
);

-- ============================================
-- r_diary_overdoses（日記と OD の関連）
-- ============================================
CREATE TABLE r_diary_overdoses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  diary_id INTEGER NOT NULL REFERENCES t_diaries(id) ON DELETE CASCADE,
  overdose_id INTEGER NOT NULL REFERENCES t_overdoses(id) ON DELETE CASCADE,
  source_id INTEGER,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  deleted_at TEXT,
  created_by INTEGER NOT NULL REFERENCES m_users(id),
  updated_by INTEGER NOT NULL REFERENCES m_users(id),
  deleted_by INTEGER REFERENCES m_users(id),
  UNIQUE (diary_id, overdose_id)
);

-- ============================================
-- t_medication_intakes（服薬実績）
-- ============================================
CREATE TABLE t_medication_intakes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES m_users(id) ON DELETE CASCADE,
  user_medication_id INTEGER NOT NULL REFERENCES r_user_medications(id) ON DELETE CASCADE,
  intake_date TEXT NOT NULL,
  adherence_score INTEGER CHECK (adherence_score IS NULL OR (adherence_score BETWEEN 0 AND 10)),
  note TEXT,
  source_id INTEGER,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  deleted_at TEXT,
  created_by INTEGER NOT NULL REFERENCES m_users(id),
  updated_by INTEGER NOT NULL REFERENCES m_users(id),
  deleted_by INTEGER REFERENCES m_users(id),
  UNIQUE (user_medication_id, intake_date)
);

-- ============================================
-- t_bank_transactions（銀行取引明細）
-- ============================================
CREATE TABLE t_bank_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES m_users(id) ON DELETE CASCADE,
  txn_date TEXT NOT NULL,
  txn_type TEXT NOT NULL CHECK (txn_type IN ('支払', '入金')),
  amount INTEGER NOT NULL CHECK (amount >= 0),
  description TEXT,
  memo TEXT CHECK (memo IS NULL OR length(memo) <= 500),
  source_file_name TEXT,
  source_id INTEGER,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  deleted_at TEXT,
  created_by INTEGER NOT NULL REFERENCES m_users(id),
  updated_by INTEGER NOT NULL REFERENCES m_users(id),
  deleted_by INTEGER REFERENCES m_users(id)
);

-- ============================================
-- t_sessions（セッショントークン）
-- token_hash は平文トークンの SHA-256 hex。平文は保存しない。
-- revoked_at が NULL で、expires_at が現在より後なら有効。
-- ============================================
CREATE TABLE t_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES m_users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE CHECK (
    length(token_hash) = 64 AND token_hash NOT GLOB '*[^0-9a-f]*'
  ),
  expires_at TEXT NOT NULL,
  revoked_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

-- ============================================
-- インデックス（GIN は SQLite に無いので付けない）
-- ============================================
CREATE INDEX idx_t_diaries_user_id ON t_diaries(user_id);
CREATE INDEX idx_t_diaries_journal_date ON t_diaries(journal_date);
CREATE INDEX idx_t_diaries_user_date ON t_diaries(user_id, journal_date);
CREATE INDEX idx_t_diary_attachments_diary_id ON t_diary_attachments(diary_id);
CREATE INDEX idx_r_user_medications_user_id ON r_user_medications(user_id);
CREATE INDEX idx_r_user_medications_medication_id ON r_user_medications(medication_id);
CREATE INDEX idx_r_user_medications_is_current ON r_user_medications(is_current);
CREATE INDEX idx_r_user_ext_accounts_user_id ON r_user_ext_accounts(user_id);
CREATE INDEX idx_r_user_ext_accounts_provider ON r_user_ext_accounts(provider);
CREATE INDEX idx_t_overdoses_user_id ON t_overdoses(user_id);
CREATE INDEX idx_t_overdoses_occurred_at ON t_overdoses(occurred_at);
CREATE INDEX idx_t_overdoses_medication_id ON t_overdoses(medication_id);
CREATE INDEX idx_t_medication_intakes_user_id ON t_medication_intakes(user_id);
CREATE INDEX idx_t_medication_intakes_user_medication_id ON t_medication_intakes(user_medication_id);
CREATE INDEX idx_t_medication_intakes_intake_date ON t_medication_intakes(intake_date);
CREATE INDEX idx_r_diary_overdoses_diary_id ON r_diary_overdoses(diary_id);
CREATE INDEX idx_r_diary_overdoses_overdose_id ON r_diary_overdoses(overdose_id);
CREATE INDEX idx_t_bank_transactions_user_date ON t_bank_transactions(user_id, txn_date DESC);
CREATE INDEX idx_t_bank_transactions_user_type_date ON t_bank_transactions(
  user_id,
  txn_type,
  txn_date DESC
);
CREATE INDEX idx_t_sessions_user_id ON t_sessions(user_id);
