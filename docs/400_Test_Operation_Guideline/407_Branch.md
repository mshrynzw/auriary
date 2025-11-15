# テスト運用ガイドライン：ブランチ戦略

## 9. ブランチ戦略

### 9.1 ブランチ構成

```
main
  └── develop
       └── feature/diary-create
       └── feature/diary-edit
       └── fix/bug-fix
```

### 9.2 ブランチごとのテスト

- **main**: すべてのテストが通過していること
- **develop**: すべてのテストが通過していること
- **feature/***: 該当機能のテストが通過していること

### 9.3 マージ前のチェック

```bash
# マージ前に実行
pnpm test
pnpm lint
pnpm type-check
```

### 9.4 ブランチ戦略とテストの関係

| ブランチ | 必須テスト | 推奨テスト |
|---------|----------|----------|
| `main` | すべて | すべて |
| `develop` | すべて | すべて |
| `feature/*` | 該当機能 | 関連機能 |
| `fix/*` | 該当バグ | リグレッションテスト |

---

**関連ドキュメント:**
- [概要](./401_Overview.md)
- [デグレ防止・優先順位](./404_Regression.md)
- [Git コミット規約](../300_Cording/304_GitConventions.md)

