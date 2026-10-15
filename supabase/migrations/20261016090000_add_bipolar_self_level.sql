-- 躁鬱（自己判定）。0=最悪の鬱、5=どちらでもない、10=最高の躁。
-- 過去の日記は未入力のままにし、新規日記の初期値だけ中央の 5 にする。
ALTER TABLE t_diaries
ADD COLUMN bipolar_self_level SMALLINT
  CHECK (bipolar_self_level IS NULL OR (bipolar_self_level BETWEEN 0 AND 10));

ALTER TABLE m_user_daily_defaults
ADD COLUMN bipolar_self_level_default SMALLINT NOT NULL DEFAULT 5
  CHECK (bipolar_self_level_default BETWEEN 0 AND 10);
