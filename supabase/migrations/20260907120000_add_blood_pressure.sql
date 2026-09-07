-- t_diariesに1日1回の血圧・脈拍を追加
ALTER TABLE t_diaries
  ADD COLUMN systolic SMALLINT,
  ADD COLUMN diastolic SMALLINT,
  ADD COLUMN pulse SMALLINT;

ALTER TABLE t_diaries
  ADD CONSTRAINT t_diaries_systolic_check CHECK (systolic IS NULL OR (systolic BETWEEN 50 AND 250)),
  ADD CONSTRAINT t_diaries_diastolic_check CHECK (diastolic IS NULL OR (diastolic BETWEEN 30 AND 160)),
  ADD CONSTRAINT t_diaries_pulse_check CHECK (pulse IS NULL OR (pulse BETWEEN 30 AND 220)),
  ADD CONSTRAINT t_diaries_bp_order_check CHECK (
    systolic IS NULL OR diastolic IS NULL OR systolic >= diastolic
  );

COMMENT ON COLUMN t_diaries.systolic IS '収縮期血圧 (mmHg)';
COMMENT ON COLUMN t_diaries.diastolic IS '拡張期血圧 (mmHg)';
COMMENT ON COLUMN t_diaries.pulse IS '脈拍 (bpm)';
