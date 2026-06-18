-- ============================================
-- t_diariesにアルコール摂取記録列を追加
-- ============================================
ALTER TABLE t_diaries ADD COLUMN has_alcohol BOOLEAN DEFAULT false;
ALTER TABLE t_diaries ADD COLUMN alcohol_times JSONB DEFAULT '[]'::jsonb;

CREATE INDEX idx_t_diaries_alcohol_times ON t_diaries USING GIN (alcohol_times);
