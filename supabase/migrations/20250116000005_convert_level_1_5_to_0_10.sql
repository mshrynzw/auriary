-- ============================================
-- レベルスコアを1～5から0～10に変換
-- ============================================

-- 重要: データ更新前にCHECK制約を削除する必要があります
-- 変換式: ROUND((x - 1) * 2.5)
-- 1 → 0, 2 → 3, 3 → 5, 4 → 8, 5 → 10

-- t_diariesテーブルのCHECK制約を削除（データ更新前に実行）
-- 既存のCHECK制約を動的に削除（制約名が自動生成されている可能性があるため）
DO $$
DECLARE
  constraint_name TEXT;
BEGIN
  -- sleep_qualityのCHECK制約を削除
  FOR constraint_name IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 't_diaries'::regclass
    AND contype = 'c'
    AND conname LIKE '%sleep_quality%'
  LOOP
    EXECUTE 'ALTER TABLE t_diaries DROP CONSTRAINT IF EXISTS ' || constraint_name;
  END LOOP;

  -- wake_levelのCHECK制約を削除
  FOR constraint_name IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 't_diaries'::regclass
    AND contype = 'c'
    AND conname LIKE '%wake_level%'
  LOOP
    EXECUTE 'ALTER TABLE t_diaries DROP CONSTRAINT IF EXISTS ' || constraint_name;
  END LOOP;

  -- daytime_levelのCHECK制約を削除
  FOR constraint_name IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 't_diaries'::regclass
    AND contype = 'c'
    AND conname LIKE '%daytime_level%'
  LOOP
    EXECUTE 'ALTER TABLE t_diaries DROP CONSTRAINT IF EXISTS ' || constraint_name;
  END LOOP;

  -- pre_sleep_levelのCHECK制約を削除
  FOR constraint_name IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 't_diaries'::regclass
    AND contype = 'c'
    AND conname LIKE '%pre_sleep_level%'
  LOOP
    EXECUTE 'ALTER TABLE t_diaries DROP CONSTRAINT IF EXISTS ' || constraint_name;
  END LOOP;

  -- med_adherence_levelのCHECK制約を削除
  FOR constraint_name IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 't_diaries'::regclass
    AND contype = 'c'
    AND conname LIKE '%med_adherence_level%'
  LOOP
    EXECUTE 'ALTER TABLE t_diaries DROP CONSTRAINT IF EXISTS ' || constraint_name;
  END LOOP;

  -- appetite_levelのCHECK制約を削除
  FOR constraint_name IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 't_diaries'::regclass
    AND contype = 'c'
    AND conname LIKE '%appetite_level%'
  LOOP
    EXECUTE 'ALTER TABLE t_diaries DROP CONSTRAINT IF EXISTS ' || constraint_name;
  END LOOP;

  -- sleep_desire_levelのCHECK制約を削除
  FOR constraint_name IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 't_diaries'::regclass
    AND contype = 'c'
    AND conname LIKE '%sleep_desire_level%'
  LOOP
    EXECUTE 'ALTER TABLE t_diaries DROP CONSTRAINT IF EXISTS ' || constraint_name;
  END LOOP;

  -- exercise_levelのCHECK制約を削除
  FOR constraint_name IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 't_diaries'::regclass
    AND contype = 'c'
    AND conname LIKE '%exercise_level%'
  LOOP
    EXECUTE 'ALTER TABLE t_diaries DROP CONSTRAINT IF EXISTS ' || constraint_name;
  END LOOP;
END $$;

-- t_diariesテーブルの各レベルカラムのデータ変換（制約削除後）
UPDATE t_diaries
SET 
  sleep_quality = ROUND((sleep_quality - 1) * 2.5)
WHERE sleep_quality IS NOT NULL;

UPDATE t_diaries
SET 
  wake_level = ROUND((wake_level - 1) * 2.5)
WHERE wake_level IS NOT NULL;

UPDATE t_diaries
SET 
  daytime_level = ROUND((daytime_level - 1) * 2.5)
WHERE daytime_level IS NOT NULL;

UPDATE t_diaries
SET 
  pre_sleep_level = ROUND((pre_sleep_level - 1) * 2.5)
WHERE pre_sleep_level IS NOT NULL;

UPDATE t_diaries
SET 
  med_adherence_level = ROUND((med_adherence_level - 1) * 2.5)
WHERE med_adherence_level IS NOT NULL;

UPDATE t_diaries
SET 
  appetite_level = ROUND((appetite_level - 1) * 2.5)
WHERE appetite_level IS NOT NULL;

UPDATE t_diaries
SET 
  sleep_desire_level = ROUND((sleep_desire_level - 1) * 2.5)
WHERE sleep_desire_level IS NOT NULL;

UPDATE t_diaries
SET 
  exercise_level = ROUND((exercise_level - 1) * 2.5)
WHERE exercise_level IS NOT NULL;

-- 新しいCHECK制約を追加（データ更新後）
ALTER TABLE t_diaries
  ADD CONSTRAINT t_diaries_sleep_quality_check CHECK (sleep_quality IS NULL OR (sleep_quality BETWEEN 0 AND 10)),
  ADD CONSTRAINT t_diaries_wake_level_check CHECK (wake_level IS NULL OR (wake_level BETWEEN 0 AND 10)),
  ADD CONSTRAINT t_diaries_daytime_level_check CHECK (daytime_level IS NULL OR (daytime_level BETWEEN 0 AND 10)),
  ADD CONSTRAINT t_diaries_pre_sleep_level_check CHECK (pre_sleep_level IS NULL OR (pre_sleep_level BETWEEN 0 AND 10)),
  ADD CONSTRAINT t_diaries_med_adherence_level_check CHECK (med_adherence_level IS NULL OR (med_adherence_level BETWEEN 0 AND 10)),
  ADD CONSTRAINT t_diaries_appetite_level_check CHECK (appetite_level IS NULL OR (appetite_level BETWEEN 0 AND 10)),
  ADD CONSTRAINT t_diaries_sleep_desire_level_check CHECK (sleep_desire_level IS NULL OR (sleep_desire_level BETWEEN 0 AND 10)),
  ADD CONSTRAINT t_diaries_exercise_level_check CHECK (exercise_level IS NULL OR (exercise_level BETWEEN 0 AND 10));

-- m_user_daily_defaultsテーブルのCHECK制約を削除（データ更新前に実行）
ALTER TABLE m_user_daily_defaults
  DROP CONSTRAINT IF EXISTS m_user_daily_defaults_sleep_quality_default_check,
  DROP CONSTRAINT IF EXISTS m_user_daily_defaults_wake_level_default_check,
  DROP CONSTRAINT IF EXISTS m_user_daily_defaults_daytime_level_default_check,
  DROP CONSTRAINT IF EXISTS m_user_daily_defaults_pre_sleep_level_default_check,
  DROP CONSTRAINT IF EXISTS m_user_daily_defaults_med_adherence_level_default_check,
  DROP CONSTRAINT IF EXISTS m_user_daily_defaults_appetite_level_default_check,
  DROP CONSTRAINT IF EXISTS m_user_daily_defaults_sleep_desire_level_default_check,
  DROP CONSTRAINT IF EXISTS m_user_daily_defaults_exercise_level_default_check;

-- m_user_daily_defaultsテーブルのデフォルト値変換（制約削除後）
UPDATE m_user_daily_defaults
SET 
  sleep_quality_default = ROUND((sleep_quality_default - 1) * 2.5),
  wake_level_default = ROUND((wake_level_default - 1) * 2.5),
  daytime_level_default = ROUND((daytime_level_default - 1) * 2.5),
  pre_sleep_level_default = ROUND((pre_sleep_level_default - 1) * 2.5),
  med_adherence_level_default = ROUND((med_adherence_level_default - 1) * 2.5),
  appetite_level_default = ROUND((appetite_level_default - 1) * 2.5),
  sleep_desire_level_default = ROUND((sleep_desire_level_default - 1) * 2.5);

-- exercise_level_defaultが存在する場合は変換
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'm_user_daily_defaults' 
    AND column_name = 'exercise_level_default'
  ) THEN
    UPDATE m_user_daily_defaults
    SET exercise_level_default = ROUND((exercise_level_default - 1) * 2.5);
  END IF;
END $$;

-- 新しいCHECK制約を追加（データ更新後）
ALTER TABLE m_user_daily_defaults
  ADD CONSTRAINT m_user_daily_defaults_sleep_quality_default_check CHECK (sleep_quality_default BETWEEN 0 AND 10),
  ADD CONSTRAINT m_user_daily_defaults_wake_level_default_check CHECK (wake_level_default BETWEEN 0 AND 10),
  ADD CONSTRAINT m_user_daily_defaults_daytime_level_default_check CHECK (daytime_level_default BETWEEN 0 AND 10),
  ADD CONSTRAINT m_user_daily_defaults_pre_sleep_level_default_check CHECK (pre_sleep_level_default BETWEEN 0 AND 10),
  ADD CONSTRAINT m_user_daily_defaults_med_adherence_level_default_check CHECK (med_adherence_level_default BETWEEN 0 AND 10),
  ADD CONSTRAINT m_user_daily_defaults_appetite_level_default_check CHECK (appetite_level_default BETWEEN 0 AND 10),
  ADD CONSTRAINT m_user_daily_defaults_sleep_desire_level_default_check CHECK (sleep_desire_level_default BETWEEN 0 AND 10);

-- exercise_level_defaultのCHECK制約を変更（存在する場合）
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'm_user_daily_defaults' 
    AND column_name = 'exercise_level_default'
  ) THEN
    ALTER TABLE m_user_daily_defaults
      ADD CONSTRAINT m_user_daily_defaults_exercise_level_default_check CHECK (exercise_level_default BETWEEN 0 AND 10);
  END IF;
END $$;

-- m_user_daily_defaultsテーブルのデフォルト値を変更（3 → 5）
ALTER TABLE m_user_daily_defaults
  ALTER COLUMN sleep_quality_default SET DEFAULT 5,
  ALTER COLUMN wake_level_default SET DEFAULT 5,
  ALTER COLUMN daytime_level_default SET DEFAULT 5,
  ALTER COLUMN pre_sleep_level_default SET DEFAULT 5,
  ALTER COLUMN med_adherence_level_default SET DEFAULT 5,
  ALTER COLUMN appetite_level_default SET DEFAULT 5,
  ALTER COLUMN sleep_desire_level_default SET DEFAULT 5;

-- exercise_level_defaultのデフォルト値を変更（存在する場合）
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'm_user_daily_defaults' 
    AND column_name = 'exercise_level_default'
  ) THEN
    ALTER TABLE m_user_daily_defaults
      ALTER COLUMN exercise_level_default SET DEFAULT 5;
  END IF;
END $$;

-- t_medication_intakesテーブルのCHECK制約を削除（データ更新前に実行）
-- 既存のCHECK制約を動的に削除（制約名が自動生成されている可能性があるため）
DO $$
DECLARE
  constraint_name TEXT;
BEGIN
  FOR constraint_name IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 't_medication_intakes'::regclass
    AND contype = 'c'
    AND conname LIKE '%adherence_score%'
  LOOP
    EXECUTE 'ALTER TABLE t_medication_intakes DROP CONSTRAINT IF EXISTS ' || constraint_name;
  END LOOP;
END $$;

-- t_medication_intakesテーブルのadherence_scoreも変換（制約削除後）
UPDATE t_medication_intakes
SET 
  adherence_score = ROUND((adherence_score - 1) * 2.5)
WHERE adherence_score IS NOT NULL;

-- 新しいCHECK制約を追加（データ更新後）
ALTER TABLE t_medication_intakes
  ADD CONSTRAINT t_medication_intakes_adherence_score_check CHECK (adherence_score IS NULL OR (adherence_score BETWEEN 0 AND 10));

