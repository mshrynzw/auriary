-- ============================================
-- m_user_daily_defaults に時刻デフォルト値を追加
-- ============================================
ALTER TABLE m_user_daily_defaults
ADD COLUMN IF NOT EXISTS sleep_start_at_default TIME,
ADD COLUMN IF NOT EXISTS sleep_end_at_default TIME,
ADD COLUMN IF NOT EXISTS bath_start_at_default TIME,
ADD COLUMN IF NOT EXISTS bath_end_at_default TIME;

