-- t_diariesテーブルにsentiment_analysis_resultカラムを追加
-- 感情分析の完全な結果（highlighted_wordsなど）をJSONB形式で保存
ALTER TABLE t_diaries
ADD COLUMN sentiment_analysis_result JSONB;

-- インデックスを追加（JSONB検索用）
CREATE INDEX idx_t_diaries_sentiment_analysis_result ON t_diaries USING GIN (sentiment_analysis_result);

-- 既存データの感情分析結果を保存するには、以下のスクリプトを実行してください:
--   pnpm backfill:sentiment
-- 
-- 必要な環境変数:
--   NEXT_PUBLIC_SUPABASE_URL - SupabaseプロジェクトのURL
--   SUPABASE_SERVICE_ROLE_KEY - Supabase Service Role Key（RLSをバイパスするため）
--   NEXT_PUBLIC_SENTIMENT_API_URL - 感情分析APIのURL（デフォルト: http://localhost:8000）
