# テスト運用ガイドライン：CI/CD

## 7. GitHub Actions でのテストパイプライン

### 7.1 パイプライン構成

```yaml
# .github/workflows/test.yml
name: Test Pipeline

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main, develop]

jobs:
  unit-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm test:unit
      - uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json

  integration-test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: supabase/postgres:15.1.0.147
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm test:integration

  e2e-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm build
      - run: pnpm test:e2e
        env:
          PLAYWRIGHT_BROWSERS_PATH: 0
```

### 7.2 テスト結果の通知

- テスト失敗時は Slack / Discord に通知（将来実装）
- プルリクエストにテスト結果をコメント

### 7.3 パイプラインの最適化

- テストを並列実行して時間を短縮
- キャッシュを活用してビルド時間を短縮
- 必要なテストのみを実行（変更されたファイルに基づく）

---

**関連ドキュメント:**
- [概要](./401_Overview.md)
- [テスト実行タイミング](./405_Execution.md)
- [開発フロー・ワークフロー](./402_Workflow.md)

