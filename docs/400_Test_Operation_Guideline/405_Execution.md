# テスト運用ガイドライン：テスト実行タイミング

## 5. テスト実行タイミング

### 5.1 開発時

```bash
# 単体テストをウォッチモードで実行
pnpm test:unit:watch

# 特定のファイルのみテスト
pnpm test:unit src/__tests__/unit/schemas/diary-form.test.ts

# 結合テストを実行（必要時）
pnpm test:integration

# E2Eテストを実行（必要時）
pnpm test:e2e
```

### 5.2 コミット前

```bash
# すべてのテストを実行
pnpm test

# カバレッジレポートを生成
pnpm test:coverage
```

### 5.3 プルリクエスト時

GitHub Actions で自動実行：

```yaml
# .github/workflows/test.yml
name: Test
on: [pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - run: pnpm test:unit
      - run: pnpm test:integration
      - run: pnpm test:e2e
```

---

**関連ドキュメント:**
- [概要](./401_Overview.md)
- [CI/CD](./406_CI_CD.md)
- [リファレンス](./411_Reference.md)

