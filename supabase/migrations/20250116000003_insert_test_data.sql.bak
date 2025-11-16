-- ============================================
-- テストデータ生成スクリプト
-- t_diariesテーブルに大量のテストデータを挿入
-- user_id=1のデータを多く生成
-- ============================================

-- 既存のユーザーIDを取得（user_id=1が存在する場合はそれを使用、なければ最初のユーザーを使用）
DO $$
DECLARE
  primary_user_id BIGINT;
  primary_auth_user_id UUID;
BEGIN
  -- user_id=1が存在するか確認
  SELECT id, auth_user_id INTO primary_user_id, primary_auth_user_id 
  FROM m_users 
  WHERE id = 1 AND is_active = true AND deleted_at IS NULL;
  
  -- 存在しない場合は最初のアクティブなユーザーを使用
  IF primary_user_id IS NULL THEN
    SELECT id, auth_user_id INTO primary_user_id, primary_auth_user_id 
    FROM m_users 
    WHERE is_active = true AND deleted_at IS NULL 
    ORDER BY id 
    LIMIT 1;
  END IF;
  
  -- ユーザーが見つからない場合はエラー
  IF primary_user_id IS NULL THEN
    RAISE EXCEPTION 'アクティブなユーザーが見つかりません。まずユーザーを作成してください。';
  END IF;
  
  RAISE NOTICE '使用するuser_id: %, auth_user_id: %', primary_user_id, primary_auth_user_id;
END $$;

-- テストデータ生成関数
DO $$
DECLARE
  start_date DATE;
  end_date DATE;
  loop_date DATE;
  diary_count INTEGER := 0;
  target_user_id BIGINT;
  target_auth_user_id UUID;
  -- ランダムな値生成用
  random_sleep_quality SMALLINT;
  random_wake_level SMALLINT;
  random_daytime_level SMALLINT;
  random_pre_sleep_level SMALLINT;
  random_med_adherence_level SMALLINT;
  random_appetite_level SMALLINT;
  random_sleep_desire_level SMALLINT;
  random_mood SMALLINT;
  random_has_od BOOLEAN;
  random_note TEXT;
  sleep_start TIMESTAMPTZ;
  sleep_end TIMESTAMPTZ;
  bath_start TIMESTAMPTZ;
  bath_end TIMESTAMPTZ;
BEGIN
  -- 使用するユーザーIDを取得
  SELECT id, auth_user_id INTO target_user_id, target_auth_user_id 
  FROM m_users 
  WHERE id = 1 AND is_active = true AND deleted_at IS NULL;
  
  -- user_id=1が存在しない場合は最初のアクティブなユーザーを使用
  IF target_user_id IS NULL THEN
    SELECT id, auth_user_id INTO target_user_id, target_auth_user_id 
    FROM m_users 
    WHERE is_active = true AND deleted_at IS NULL 
    ORDER BY id 
    LIMIT 1;
  END IF;
  
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'アクティブなユーザーが見つかりません。';
  END IF;
  
  -- 過去6ヶ月分のデータを生成
  start_date := CURRENT_DATE - INTERVAL '6 months';
  end_date := CURRENT_DATE;
  loop_date := start_date;
  
  -- user_id=1のデータを生成（約80%）
  WHILE loop_date <= end_date LOOP
    -- 80%の確率でuser_id=1のデータを生成
    IF random() < 0.8 THEN
      -- ランダムな値を生成
      random_sleep_quality := (1 + floor(random() * 5))::SMALLINT;
      random_wake_level := (1 + floor(random() * 5))::SMALLINT;
      random_daytime_level := (1 + floor(random() * 5))::SMALLINT;
      random_pre_sleep_level := (1 + floor(random() * 5))::SMALLINT;
      random_med_adherence_level := (1 + floor(random() * 5))::SMALLINT;
      random_appetite_level := (1 + floor(random() * 5))::SMALLINT;
      random_sleep_desire_level := (1 + floor(random() * 5))::SMALLINT;
      random_mood := (1 + floor(random() * 10))::SMALLINT;
      random_has_od := (random() < 0.1); -- 10%の確率でtrue
      
      -- ノートの生成（50%の確率で本文あり）
      IF random() < 0.5 THEN
        random_note := '今日は' || 
          CASE floor(random() * 5)
            WHEN 0 THEN '良い一日でした。'
            WHEN 1 THEN '少し疲れました。'
            WHEN 2 THEN '充実した日でした。'
            WHEN 3 THEN 'リラックスできました。'
            ELSE '普通の一日でした。'
          END;
      ELSE
        random_note := NULL;
      END IF;
      
      -- 睡眠時間の生成（70%の確率でデータあり）
      IF random() < 0.7 THEN
        sleep_start := (loop_date + INTERVAL '22 hours' + INTERVAL '30 minutes' * floor(random() * 4))::TIMESTAMPTZ;
        sleep_end := (sleep_start + INTERVAL '6 hours' + INTERVAL '30 minutes' * floor(random() * 4))::TIMESTAMPTZ;
      ELSE
        sleep_start := NULL;
        sleep_end := NULL;
      END IF;
      
      -- 入浴時間の生成（60%の確率でデータあり）
      IF random() < 0.6 THEN
        bath_start := (loop_date + INTERVAL '19 hours' + INTERVAL '30 minutes' * floor(random() * 3))::TIMESTAMPTZ;
        bath_end := (bath_start + INTERVAL '30 minutes' + INTERVAL '10 minutes' * floor(random() * 3))::TIMESTAMPTZ;
      ELSE
        bath_start := NULL;
        bath_end := NULL;
      END IF;
      
      -- 日記を挿入（重複エラーは無視）
      BEGIN
        INSERT INTO t_diaries (
          user_id,
          journal_date,
          sleep_start_at,
          sleep_end_at,
          bath_start_at,
          bath_end_at,
          sleep_quality,
          wake_level,
          daytime_level,
          pre_sleep_level,
          med_adherence_level,
          appetite_level,
          sleep_desire_level,
          note,
          has_od,
          mood,
          created_by,
          updated_by
        ) VALUES (
          target_user_id,
          loop_date,
          sleep_start,
          sleep_end,
          bath_start,
          bath_end,
          random_sleep_quality,
          random_wake_level,
          random_daytime_level,
          random_pre_sleep_level,
          random_med_adherence_level,
          random_appetite_level,
          random_sleep_desire_level,
          random_note,
          random_has_od,
          random_mood,
          target_auth_user_id,
          target_auth_user_id
        );
        diary_count := diary_count + 1;
      EXCEPTION WHEN unique_violation THEN
        -- 既に存在する日付の場合はスキップ
        NULL;
      END;
    END IF;
    
    loop_date := loop_date + INTERVAL '1 day';
  END LOOP;
  
  RAISE NOTICE 'user_id=% の日記を % 件生成しました', target_user_id, diary_count;
END $$;

-- 他のuser_idのデータも少し生成（user_id=2が存在する場合）
DO $$
DECLARE
  start_date DATE;
  end_date DATE;
  loop_date DATE;
  diary_count INTEGER := 0;
  target_user_id BIGINT;
  target_auth_user_id UUID;
  random_sleep_quality SMALLINT;
  random_wake_level SMALLINT;
  random_daytime_level SMALLINT;
  random_pre_sleep_level SMALLINT;
  random_med_adherence_level SMALLINT;
  random_appetite_level SMALLINT;
  random_sleep_desire_level SMALLINT;
  random_mood SMALLINT;
  random_has_od BOOLEAN;
  random_note TEXT;
BEGIN
  -- user_id=2が存在するか確認
  SELECT id, auth_user_id INTO target_user_id, target_auth_user_id 
  FROM m_users 
  WHERE id = 2 AND is_active = true AND deleted_at IS NULL;
  
  -- user_id=2が存在しない場合はスキップ
  IF target_user_id IS NULL THEN
    RAISE NOTICE 'user_id=2が見つからないため、スキップします';
    RETURN;
  END IF;
  
  start_date := CURRENT_DATE - INTERVAL '3 months';
  end_date := CURRENT_DATE;
  loop_date := start_date;
  
  WHILE loop_date <= end_date LOOP
    IF random() < 0.2 THEN
      random_sleep_quality := (1 + floor(random() * 5))::SMALLINT;
      random_wake_level := (1 + floor(random() * 5))::SMALLINT;
      random_daytime_level := (1 + floor(random() * 5))::SMALLINT;
      random_pre_sleep_level := (1 + floor(random() * 5))::SMALLINT;
      random_med_adherence_level := (1 + floor(random() * 5))::SMALLINT;
      random_appetite_level := (1 + floor(random() * 5))::SMALLINT;
      random_sleep_desire_level := (1 + floor(random() * 5))::SMALLINT;
      random_mood := (1 + floor(random() * 10))::SMALLINT;
      random_has_od := (random() < 0.1);
      
      IF random() < 0.5 THEN
        random_note := 'テストノート: ' || loop_date::TEXT;
      ELSE
        random_note := NULL;
      END IF;
      
      BEGIN
        INSERT INTO t_diaries (
          user_id,
          journal_date,
          sleep_quality,
          wake_level,
          daytime_level,
          pre_sleep_level,
          med_adherence_level,
          appetite_level,
          sleep_desire_level,
          note,
          has_od,
          mood,
          created_by,
          updated_by
        ) VALUES (
          target_user_id,
          loop_date,
          random_sleep_quality,
          random_wake_level,
          random_daytime_level,
          random_pre_sleep_level,
          random_med_adherence_level,
          random_appetite_level,
          random_sleep_desire_level,
          random_note,
          random_has_od,
          random_mood,
          target_auth_user_id,
          target_auth_user_id
        );
        diary_count := diary_count + 1;
      EXCEPTION WHEN unique_violation THEN
        NULL;
      END;
    END IF;
    
    loop_date := loop_date + INTERVAL '1 day';
  END LOOP;
  
  RAISE NOTICE 'user_id=% の日記を % 件生成しました', target_user_id, diary_count;
END $$;

