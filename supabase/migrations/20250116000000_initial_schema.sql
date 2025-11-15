-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. m_users（ユーザーマスタ）
-- ============================================
CREATE TABLE m_users (
  id BIGSERIAL PRIMARY KEY,
  auth_user_id UUID NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  family_name TEXT,
  first_name TEXT,
  family_name_kana TEXT,
  first_name_kana TEXT,
  email TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  source_id BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  created_by UUID NOT NULL,
  updated_by UUID NOT NULL,
  deleted_by UUID
);

-- Index for auth_user_id
CREATE INDEX idx_m_users_auth_user_id ON m_users(auth_user_id);

-- ============================================
-- 2. m_user_daily_defaults（日記のデフォルト設定）
-- ============================================
CREATE TABLE m_user_daily_defaults (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES m_users(id) ON DELETE CASCADE,
  sleep_quality_default SMALLINT NOT NULL DEFAULT 3 CHECK (sleep_quality_default BETWEEN 1 AND 5),
  wake_level_default SMALLINT NOT NULL DEFAULT 3 CHECK (wake_level_default BETWEEN 1 AND 5),
  daytime_level_default SMALLINT NOT NULL DEFAULT 3 CHECK (daytime_level_default BETWEEN 1 AND 5),
  pre_sleep_level_default SMALLINT NOT NULL DEFAULT 3 CHECK (pre_sleep_level_default BETWEEN 1 AND 5),
  med_adherence_level_default SMALLINT NOT NULL DEFAULT 3 CHECK (med_adherence_level_default BETWEEN 1 AND 5),
  appetite_level_default SMALLINT NOT NULL DEFAULT 3 CHECK (appetite_level_default BETWEEN 1 AND 5),
  sleep_desire_level_default SMALLINT NOT NULL DEFAULT 3 CHECK (sleep_desire_level_default BETWEEN 1 AND 5),
  source_id BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  created_by UUID NOT NULL,
  updated_by UUID NOT NULL,
  deleted_by UUID,
  UNIQUE(user_id)
);

-- ============================================
-- 3. t_diaries（日記・日次記録）
-- ============================================
CREATE TABLE t_diaries (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES m_users(id) ON DELETE CASCADE,
  journal_date DATE NOT NULL,
  sleep_start_at TIMESTAMPTZ,
  sleep_end_at TIMESTAMPTZ,
  bath_start_at TIMESTAMPTZ,
  bath_end_at TIMESTAMPTZ,
  sleep_quality SMALLINT CHECK (sleep_quality BETWEEN 1 AND 5),
  wake_level SMALLINT CHECK (wake_level BETWEEN 1 AND 5),
  daytime_level SMALLINT CHECK (daytime_level BETWEEN 1 AND 5),
  pre_sleep_level SMALLINT CHECK (pre_sleep_level BETWEEN 1 AND 5),
  med_adherence_level SMALLINT CHECK (med_adherence_level BETWEEN 1 AND 5),
  appetite_level SMALLINT CHECK (appetite_level BETWEEN 1 AND 5),
  sleep_desire_level SMALLINT CHECK (sleep_desire_level BETWEEN 1 AND 5),
  note TEXT,
  has_od BOOLEAN DEFAULT false,
  -- AI分析結果（将来実装）
  ai_summary TEXT,
  ai_topics JSONB,
  mood SMALLINT CHECK (mood BETWEEN 1 AND 10),
  source_id BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  created_by UUID NOT NULL,
  updated_by UUID NOT NULL,
  deleted_by UUID,
  UNIQUE(user_id, journal_date)
);

-- Indexes for t_diaries
CREATE INDEX idx_t_diaries_user_id ON t_diaries(user_id);
CREATE INDEX idx_t_diaries_journal_date ON t_diaries(journal_date);
CREATE INDEX idx_t_diaries_user_date ON t_diaries(user_id, journal_date);

-- ============================================
-- 4. t_diary_attachments（日記添付）
-- ============================================
CREATE TABLE t_diary_attachments (
  id BIGSERIAL PRIMARY KEY,
  diary_id BIGINT NOT NULL REFERENCES t_diaries(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT,
  thumbnail_path TEXT,
  source_id BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  created_by UUID NOT NULL,
  updated_by UUID NOT NULL,
  deleted_by UUID
);

-- Index for diary_id
CREATE INDEX idx_t_diary_attachments_diary_id ON t_diary_attachments(diary_id);

-- ============================================
-- 5. Functions for updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_m_users_updated_at
  BEFORE UPDATE ON m_users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_m_user_daily_defaults_updated_at
  BEFORE UPDATE ON m_user_daily_defaults
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_t_diaries_updated_at
  BEFORE UPDATE ON t_diaries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_t_diary_attachments_updated_at
  BEFORE UPDATE ON t_diary_attachments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 6. RLS (Row Level Security) Policies
-- ============================================

-- Enable RLS
ALTER TABLE m_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE m_user_daily_defaults ENABLE ROW LEVEL SECURITY;
ALTER TABLE t_diaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE t_diary_attachments ENABLE ROW LEVEL SECURITY;

-- m_users RLS Policies
CREATE POLICY "Users can view their own profile"
ON m_users FOR SELECT
USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can insert their own profile"
ON m_users FOR INSERT
WITH CHECK (auth.uid() = auth_user_id);

CREATE POLICY "Users can update their own profile"
ON m_users FOR UPDATE
USING (auth.uid() = auth_user_id)
WITH CHECK (auth.uid() = auth_user_id);

-- m_user_daily_defaults RLS Policies
CREATE POLICY "Users can view their own defaults"
ON m_user_daily_defaults FOR SELECT
USING (auth.uid() = (
  SELECT auth_user_id FROM m_users WHERE id = m_user_daily_defaults.user_id
));

CREATE POLICY "Users can insert their own defaults"
ON m_user_daily_defaults FOR INSERT
WITH CHECK (auth.uid() = (
  SELECT auth_user_id FROM m_users WHERE id = m_user_daily_defaults.user_id
));

CREATE POLICY "Users can update their own defaults"
ON m_user_daily_defaults FOR UPDATE
USING (auth.uid() = (
  SELECT auth_user_id FROM m_users WHERE id = m_user_daily_defaults.user_id
))
WITH CHECK (auth.uid() = (
  SELECT auth_user_id FROM m_users WHERE id = m_user_daily_defaults.user_id
));

-- t_diaries RLS Policies
CREATE POLICY "Users can view their own diaries"
ON t_diaries FOR SELECT
USING (auth.uid() = (
  SELECT auth_user_id FROM m_users WHERE id = t_diaries.user_id
));

CREATE POLICY "Users can insert their own diaries"
ON t_diaries FOR INSERT
WITH CHECK (auth.uid() = (
  SELECT auth_user_id FROM m_users WHERE id = t_diaries.user_id
));

CREATE POLICY "Users can update their own diaries"
ON t_diaries FOR UPDATE
USING (auth.uid() = (
  SELECT auth_user_id FROM m_users WHERE id = t_diaries.user_id
))
WITH CHECK (auth.uid() = (
  SELECT auth_user_id FROM m_users WHERE id = t_diaries.user_id
));

-- t_diary_attachments RLS Policies
CREATE POLICY "Users can view their own diary attachments"
ON t_diary_attachments FOR SELECT
USING (auth.uid() = (
  SELECT u.auth_user_id
  FROM t_diaries d
  JOIN m_users u ON d.user_id = u.id
  WHERE d.id = t_diary_attachments.diary_id
));

CREATE POLICY "Users can insert their own diary attachments"
ON t_diary_attachments FOR INSERT
WITH CHECK (auth.uid() = (
  SELECT u.auth_user_id
  FROM t_diaries d
  JOIN m_users u ON d.user_id = u.id
  WHERE d.id = t_diary_attachments.diary_id
));

CREATE POLICY "Users can update their own diary attachments"
ON t_diary_attachments FOR UPDATE
USING (auth.uid() = (
  SELECT u.auth_user_id
  FROM t_diaries d
  JOIN m_users u ON d.user_id = u.id
  WHERE d.id = t_diary_attachments.diary_id
))
WITH CHECK (auth.uid() = (
  SELECT u.auth_user_id
  FROM t_diaries d
  JOIN m_users u ON d.user_id = u.id
  WHERE d.id = t_diary_attachments.diary_id
));

