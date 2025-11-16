-- ============================================
-- t_diariesにod_times列を追加
-- ============================================
ALTER TABLE t_diaries ADD COLUMN od_times JSONB DEFAULT '[]'::jsonb;

-- Index for od_times (GIN index for JSONB queries)
CREATE INDEX idx_t_diaries_od_times ON t_diaries USING GIN (od_times);

-- ============================================
-- r_diary_overdoses（日記とODの関連テーブル）を作成
-- ============================================
CREATE TABLE r_diary_overdoses (
  id BIGSERIAL PRIMARY KEY,
  diary_id BIGINT NOT NULL REFERENCES t_diaries(id) ON DELETE CASCADE,
  overdose_id BIGINT NOT NULL REFERENCES t_overdoses(id) ON DELETE CASCADE,
  source_id BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  created_by UUID NOT NULL,
  updated_by UUID NOT NULL,
  deleted_by UUID,
  UNIQUE(diary_id, overdose_id)
);

-- Indexes for r_diary_overdoses
CREATE INDEX idx_r_diary_overdoses_diary_id ON r_diary_overdoses(diary_id);
CREATE INDEX idx_r_diary_overdoses_overdose_id ON r_diary_overdoses(overdose_id);

-- ============================================
-- Triggers for updated_at
-- ============================================
CREATE TRIGGER update_r_diary_overdoses_updated_at
  BEFORE UPDATE ON r_diary_overdoses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- RLS (Row Level Security) Policies
-- ============================================

-- Enable RLS
ALTER TABLE r_diary_overdoses ENABLE ROW LEVEL SECURITY;

-- r_diary_overdoses RLS Policies
CREATE POLICY "Users can view their own diary overdoses"
ON r_diary_overdoses FOR SELECT
USING (auth.uid() = (
  SELECT u.auth_user_id
  FROM t_diaries d
  JOIN m_users u ON d.user_id = u.id
  WHERE d.id = r_diary_overdoses.diary_id
));

CREATE POLICY "Users can insert their own diary overdoses"
ON r_diary_overdoses FOR INSERT
WITH CHECK (auth.uid() = (
  SELECT u.auth_user_id
  FROM t_diaries d
  JOIN m_users u ON d.user_id = u.id
  WHERE d.id = r_diary_overdoses.diary_id
));

CREATE POLICY "Users can update their own diary overdoses"
ON r_diary_overdoses FOR UPDATE
USING (auth.uid() = (
  SELECT u.auth_user_id
  FROM t_diaries d
  JOIN m_users u ON d.user_id = u.id
  WHERE d.id = r_diary_overdoses.diary_id
))
WITH CHECK (auth.uid() = (
  SELECT u.auth_user_id
  FROM t_diaries d
  JOIN m_users u ON d.user_id = u.id
  WHERE d.id = r_diary_overdoses.diary_id
));

CREATE POLICY "Users can delete their own diary overdoses"
ON r_diary_overdoses FOR DELETE
USING (auth.uid() = (
  SELECT u.auth_user_id
  FROM t_diaries d
  JOIN m_users u ON d.user_id = u.id
  WHERE d.id = r_diary_overdoses.diary_id
));

