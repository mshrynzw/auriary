-- ============================================
-- 5. m_medications（薬マスタ）
-- ============================================
CREATE TABLE m_medications (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  generic_name TEXT,
  memo TEXT,
  source_id BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  created_by UUID NOT NULL,
  updated_by UUID NOT NULL,
  deleted_by UUID
);

-- ============================================
-- 6. r_user_medications（ユーザー別処方）
-- ============================================
CREATE TABLE r_user_medications (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES m_users(id) ON DELETE CASCADE,
  medication_id BIGINT NOT NULL REFERENCES m_medications(id) ON DELETE CASCADE,
  dosage_text TEXT,
  dose_amount NUMERIC,
  dose_unit TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  is_current BOOLEAN NOT NULL DEFAULT true,
  source_id BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  created_by UUID NOT NULL,
  updated_by UUID NOT NULL,
  deleted_by UUID
);

-- Indexes for r_user_medications
CREATE INDEX idx_r_user_medications_user_id ON r_user_medications(user_id);
CREATE INDEX idx_r_user_medications_medication_id ON r_user_medications(medication_id);
CREATE INDEX idx_r_user_medications_is_current ON r_user_medications(is_current);

-- ============================================
-- 7. r_user_ext_accounts（外部アカウント連携）
-- ============================================
CREATE TABLE r_user_ext_accounts (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES m_users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  ext_user_id TEXT NOT NULL,
  access_token_encrypted TEXT,
  refresh_token_encrypted TEXT,
  token_expires_at TIMESTAMPTZ,
  source_id BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  created_by UUID NOT NULL,
  updated_by UUID NOT NULL,
  deleted_by UUID,
  UNIQUE(user_id, provider, ext_user_id)
);

-- Indexes for r_user_ext_accounts
CREATE INDEX idx_r_user_ext_accounts_user_id ON r_user_ext_accounts(user_id);
CREATE INDEX idx_r_user_ext_accounts_provider ON r_user_ext_accounts(provider);

-- ============================================
-- 8. t_overdoses（OD記録）
-- ============================================
CREATE TABLE t_overdoses (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES m_users(id) ON DELETE CASCADE,
  occurred_at TIMESTAMPTZ NOT NULL,
  medication_id BIGINT REFERENCES m_medications(id) ON DELETE SET NULL,
  medication_name TEXT,
  amount NUMERIC,
  amount_unit TEXT,
  note TEXT,
  source_id BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  created_by UUID NOT NULL,
  updated_by UUID NOT NULL,
  deleted_by UUID
);

-- Indexes for t_overdoses
CREATE INDEX idx_t_overdoses_user_id ON t_overdoses(user_id);
CREATE INDEX idx_t_overdoses_occurred_at ON t_overdoses(occurred_at);
CREATE INDEX idx_t_overdoses_medication_id ON t_overdoses(medication_id);

-- ============================================
-- 9. t_medication_intakes（服薬実績）
-- ============================================
CREATE TABLE t_medication_intakes (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES m_users(id) ON DELETE CASCADE,
  user_medication_id BIGINT NOT NULL REFERENCES r_user_medications(id) ON DELETE CASCADE,
  intake_date DATE NOT NULL,
  adherence_score SMALLINT CHECK (adherence_score BETWEEN 1 AND 5),
  note TEXT,
  source_id BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  created_by UUID NOT NULL,
  updated_by UUID NOT NULL,
  deleted_by UUID,
  UNIQUE(user_medication_id, intake_date)
);

-- Indexes for t_medication_intakes
CREATE INDEX idx_t_medication_intakes_user_id ON t_medication_intakes(user_id);
CREATE INDEX idx_t_medication_intakes_user_medication_id ON t_medication_intakes(user_medication_id);
CREATE INDEX idx_t_medication_intakes_intake_date ON t_medication_intakes(intake_date);

-- ============================================
-- Triggers for updated_at
-- ============================================
CREATE TRIGGER update_m_medications_updated_at
  BEFORE UPDATE ON m_medications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_r_user_medications_updated_at
  BEFORE UPDATE ON r_user_medications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_r_user_ext_accounts_updated_at
  BEFORE UPDATE ON r_user_ext_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_t_overdoses_updated_at
  BEFORE UPDATE ON t_overdoses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_t_medication_intakes_updated_at
  BEFORE UPDATE ON t_medication_intakes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- RLS (Row Level Security) Policies
-- ============================================

-- Enable RLS
ALTER TABLE m_medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE r_user_medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE r_user_ext_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE t_overdoses ENABLE ROW LEVEL SECURITY;
ALTER TABLE t_medication_intakes ENABLE ROW LEVEL SECURITY;

-- m_medications RLS Policies（全ユーザーが参照可能、管理者のみ作成・更新）
CREATE POLICY "Users can view medications"
ON m_medications FOR SELECT
USING (true);

-- r_user_medications RLS Policies
CREATE POLICY "Users can view their own medications"
ON r_user_medications FOR SELECT
USING (auth.uid() = (
  SELECT auth_user_id FROM m_users WHERE id = r_user_medications.user_id
));

CREATE POLICY "Users can insert their own medications"
ON r_user_medications FOR INSERT
WITH CHECK (auth.uid() = (
  SELECT auth_user_id FROM m_users WHERE id = r_user_medications.user_id
));

CREATE POLICY "Users can update their own medications"
ON r_user_medications FOR UPDATE
USING (auth.uid() = (
  SELECT auth_user_id FROM m_users WHERE id = r_user_medications.user_id
))
WITH CHECK (auth.uid() = (
  SELECT auth_user_id FROM m_users WHERE id = r_user_medications.user_id
));

-- r_user_ext_accounts RLS Policies
CREATE POLICY "Users can view their own ext accounts"
ON r_user_ext_accounts FOR SELECT
USING (auth.uid() = (
  SELECT auth_user_id FROM m_users WHERE id = r_user_ext_accounts.user_id
));

CREATE POLICY "Users can insert their own ext accounts"
ON r_user_ext_accounts FOR INSERT
WITH CHECK (auth.uid() = (
  SELECT auth_user_id FROM m_users WHERE id = r_user_ext_accounts.user_id
));

CREATE POLICY "Users can update their own ext accounts"
ON r_user_ext_accounts FOR UPDATE
USING (auth.uid() = (
  SELECT auth_user_id FROM m_users WHERE id = r_user_ext_accounts.user_id
))
WITH CHECK (auth.uid() = (
  SELECT auth_user_id FROM m_users WHERE id = r_user_ext_accounts.user_id
));

-- t_overdoses RLS Policies
CREATE POLICY "Users can view their own overdoses"
ON t_overdoses FOR SELECT
USING (auth.uid() = (
  SELECT auth_user_id FROM m_users WHERE id = t_overdoses.user_id
));

CREATE POLICY "Users can insert their own overdoses"
ON t_overdoses FOR INSERT
WITH CHECK (auth.uid() = (
  SELECT auth_user_id FROM m_users WHERE id = t_overdoses.user_id
));

CREATE POLICY "Users can update their own overdoses"
ON t_overdoses FOR UPDATE
USING (auth.uid() = (
  SELECT auth_user_id FROM m_users WHERE id = t_overdoses.user_id
))
WITH CHECK (auth.uid() = (
  SELECT auth_user_id FROM m_users WHERE id = t_overdoses.user_id
));

-- t_medication_intakes RLS Policies
CREATE POLICY "Users can view their own medication intakes"
ON t_medication_intakes FOR SELECT
USING (auth.uid() = (
  SELECT auth_user_id FROM m_users WHERE id = t_medication_intakes.user_id
));

CREATE POLICY "Users can insert their own medication intakes"
ON t_medication_intakes FOR INSERT
WITH CHECK (auth.uid() = (
  SELECT auth_user_id FROM m_users WHERE id = t_medication_intakes.user_id
));

CREATE POLICY "Users can update their own medication intakes"
ON t_medication_intakes FOR UPDATE
USING (auth.uid() = (
  SELECT auth_user_id FROM m_users WHERE id = t_medication_intakes.user_id
))
WITH CHECK (auth.uid() = (
  SELECT auth_user_id FROM m_users WHERE id = t_medication_intakes.user_id
));

