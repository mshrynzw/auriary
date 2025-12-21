/**
 * 既存の日記データに対して感情分析を実行し、結果をデータベースに保存するスクリプト
 *
 * 使用方法:
 *   pnpm backfill:sentiment
 *
 * 環境変数（.env.localに設定）:
 *   NEXT_PUBLIC_SUPABASE_URL - SupabaseプロジェクトのURL
 *   SUPABASE_SERVICE_ROLE_KEY - Supabase Service Role Key（RLSをバイパスするため）
 *   NEXT_PUBLIC_SENTIMENT_API_URL - 感情分析APIのURL（デフォルト: http://localhost:8000）
 */

// .env.localファイルを読み込む
import { config } from 'dotenv';
import { resolve } from 'path';

// .env.localファイルのパスを指定
config({ path: resolve(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';

// 感情分析APIの呼び出し関数（analyzeSentimentを直接実装）
const API_BASE_URL = process.env.NEXT_PUBLIC_SENTIMENT_API_URL || 'http://localhost:8000';

async function analyzeSentiment(text: string) {
  const response = await fetch(`${API_BASE_URL}/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.statusText}`);
  }

  return await response.json();
}

// 環境変数の読み込み
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('環境変数が設定されていません:');
  console.error('  NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('  SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceRoleKey ? '✓' : '✗');
  process.exit(1);
}

// Service Role Keyを使用してSupabaseクライアントを作成（RLSをバイパス）
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function backfillSentimentAnalysis() {
  console.log('既存の日記データに対して感情分析を実行します...\n');

  // sentiment_analysis_resultがnullまたは存在しない日記を取得
  // noteが存在し、sentiment_analysis_resultがnullのもの
  const { data: diaries, error: fetchError } = await supabase
    .from('t_diaries')
    .select('id, note, user_id')
    .not('note', 'is', null)
    .is('sentiment_analysis_result', null)
    .is('deleted_at', null)
    .order('id', { ascending: true });

  if (fetchError) {
    console.error('日記データの取得に失敗しました:', fetchError);
    process.exit(1);
  }

  if (!diaries || diaries.length === 0) {
    console.log('処理対象の日記がありません。');
    return;
  }

  console.log(`処理対象: ${diaries.length}件の日記\n`);

  let successCount = 0;
  let errorCount = 0;
  const errors: Array<{ id: number; error: string }> = [];

  // バッチ処理（一度に処理する件数）
  const BATCH_SIZE = 10;
  const DELAY_MS = 1000; // API呼び出し間の遅延（ミリ秒）

  for (let i = 0; i < diaries.length; i += BATCH_SIZE) {
    const batch = diaries.slice(i, i + BATCH_SIZE);
    console.log(
      `処理中: ${i + 1}〜${Math.min(i + BATCH_SIZE, diaries.length)}件目 / ${diaries.length}件`,
    );

    // バッチ内の各日記を処理
    const promises = batch.map(async (diary) => {
      if (!diary.note || diary.note.trim().length === 0) {
        return { id: diary.id, success: true };
      }

      try {
        // 感情分析を実行
        const sentimentResult = await analyzeSentiment(diary.note);

        // データベースに保存
        const sentimentAnalysisResult = {
          sentiment: sentimentResult.sentiment,
          score: sentimentResult.score,
          confidence: sentimentResult.confidence,
          highlighted_words: sentimentResult.highlighted_words,
          overall_sentiment_score: sentimentResult.overall_sentiment_score,
          model_used: sentimentResult.model_used,
        };

        const { error: updateError } = await supabase
          .from('t_diaries')
          .update({
            mood: sentimentResult.score,
            sentiment_analysis_result: sentimentAnalysisResult,
          })
          .eq('id', diary.id);

        if (updateError) {
          throw new Error(`データベース更新エラー: ${updateError.message}`);
        }

        return { id: diary.id, success: true };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`  日記ID ${diary.id} の処理に失敗:`, errorMessage);
        return { id: diary.id, success: false, error: errorMessage };
      }
    });

    // バッチ内の処理を実行
    const results = await Promise.all(promises);

    // 結果を集計
    results.forEach((result) => {
      if (result.success) {
        successCount++;
      } else {
        errorCount++;
        errors.push({ id: result.id, error: result.error || 'Unknown error' });
      }
    });

    // API呼び出し間の遅延（レート制限対策）
    if (i + BATCH_SIZE < diaries.length) {
      await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
    }
  }

  // 結果を表示
  console.log('\n=== 処理完了 ===');
  console.log(`成功: ${successCount}件`);
  console.log(`失敗: ${errorCount}件`);

  if (errors.length > 0) {
    console.log('\nエラー詳細:');
    errors.forEach(({ id, error }) => {
      console.log(`  日記ID ${id}: ${error}`);
    });
  }
}

// スクリプトを実行
backfillSentimentAnalysis()
  .then(() => {
    console.log('\nスクリプトが正常に完了しました。');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nスクリプトの実行中にエラーが発生しました:', error);
    process.exit(1);
  });
