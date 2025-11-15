# テスト運用ガイドライン：インフラ

## 13. Supabase Test DB の運用方法

### 13.1 ローカル開発環境

```bash
# Supabase ローカル環境を起動
supabase start

# テスト用データベースを初期化
supabase db reset

# テスト用シードデータを投入
supabase db seed
```

### 13.2 テスト用データベースの設定

```typescript
// src/lib/supabase-test.ts
import { createClient } from '@supabase/supabase-js';

export function createTestSupabaseClient() {
  return createClient(
    process.env.SUPABASE_TEST_URL || 'http://localhost:54321',
    process.env.SUPABASE_TEST_ANON_KEY || 'test-anon-key',
  );
}
```

### 13.3 テストデータの管理

- テスト用シードデータ: `supabase/seed/test.sql`
- テストごとにデータをクリーンアップ
- テストデータは本番データと分離

### 13.4 テスト環境の分離

- 開発環境: ローカル Supabase
- テスト環境: ローカル Supabase（テスト専用）
- 本番環境: Supabase Cloud

---

## 14. バージョン管理とテストの整合性ルール

### 14.1 バージョン管理

- テストコードもバージョン管理の対象
- テストの変更もコミットに含める
- テストのバージョンと実装のバージョンを一致させる

### 14.2 テストの互換性

- 新しいバージョンのテストは古いバージョンでも動作すること
- 破壊的変更時はテストも更新
- テストの後方互換性を考慮

### 14.3 マイグレーションとテスト

- データベースマイグレーション時はテストも更新
- マイグレーション前後でテストが通過することを確認
- マイグレーションのロールバックテスト

---

**関連ドキュメント:**
- [概要](./401_Overview.md)
- [リリース・メンテナンス](./409_Release.md)
- [Supabase 高度な機能](../202_DetailedDesign/205_DetailedDesign_Supabase_Advanced.md)

