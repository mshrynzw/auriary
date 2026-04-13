-- ============================================
-- t_bank_transactions（銀行取引明細）
-- ============================================
CREATE TABLE t_bank_transactions (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES m_users(id) ON DELETE CASCADE,
  txn_date DATE NOT NULL,
  txn_type TEXT NOT NULL CHECK (txn_type IN ('支払', '入金')),
  amount INTEGER NOT NULL CHECK (amount >= 0),
  description TEXT,
  source_file_name TEXT,
  source_id BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  created_by UUID NOT NULL,
  updated_by UUID NOT NULL,
  deleted_by UUID
);

CREATE INDEX idx_t_bank_transactions_user_date ON t_bank_transactions(user_id, txn_date DESC);
CREATE INDEX idx_t_bank_transactions_user_type_date
  ON t_bank_transactions(user_id, txn_type, txn_date DESC);

-- updated_at trigger
CREATE TRIGGER update_t_bank_transactions_updated_at
  BEFORE UPDATE ON t_bank_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE t_bank_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own bank transactions"
ON t_bank_transactions FOR SELECT
USING (auth.uid() = (
  SELECT auth_user_id FROM m_users WHERE id = t_bank_transactions.user_id
));

CREATE POLICY "Users can insert their own bank transactions"
ON t_bank_transactions FOR INSERT
WITH CHECK (auth.uid() = (
  SELECT auth_user_id FROM m_users WHERE id = t_bank_transactions.user_id
));

CREATE POLICY "Users can update their own bank transactions"
ON t_bank_transactions FOR UPDATE
USING (auth.uid() = (
  SELECT auth_user_id FROM m_users WHERE id = t_bank_transactions.user_id
))
WITH CHECK (auth.uid() = (
  SELECT auth_user_id FROM m_users WHERE id = t_bank_transactions.user_id
));

CREATE POLICY "Users can delete their own bank transactions"
ON t_bank_transactions FOR DELETE
USING (auth.uid() = (
  SELECT auth_user_id FROM m_users WHERE id = t_bank_transactions.user_id
));
