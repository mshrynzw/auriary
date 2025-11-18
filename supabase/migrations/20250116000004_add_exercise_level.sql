-- t_diariesテーブルにexercise_levelカラムを追加
ALTER TABLE t_diaries
ADD COLUMN exercise_level SMALLINT CHECK (exercise_level BETWEEN 1 AND 5);

-- m_user_daily_defaultsテーブルにexercise_level_defaultカラムを追加
ALTER TABLE m_user_daily_defaults
ADD COLUMN exercise_level_default SMALLINT NOT NULL DEFAULT 3 CHECK (exercise_level_default BETWEEN 1 AND 5);

