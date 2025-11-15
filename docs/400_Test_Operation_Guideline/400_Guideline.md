# テスト運用ガイドライン

## テスト運用ガイドライン

本ドキュメントは、auriary プロジェクトにおけるテスト運用の全体像を定めたものです。開発から単体テスト、結合テスト、E2Eテストまでの一連の流れと、1人開発に最適化されたワークフローを定義します。

---

## ドキュメント構成

テスト運用ガイドラインは以下のドキュメントに分割されています：

### 基本

- [401_Overview.md](./401_Overview.md) - テストの全体像・開発フロー
- [402_Workflow.md](./402_Workflow.md) - 1人開発ワークフロー・実践例

### 規約・戦略

- [403_Commit_PR.md](./403_Commit_PR.md) - コミット・PR規約
- [404_Regression.md](./404_Regression.md) - デグレ防止・優先順位
- [405_Execution.md](./405_Execution.md) - テスト実行タイミング
- [407_Branch.md](./407_Branch.md) - ブランチ戦略

### CI/CD・インフラ

- [406_CI_CD.md](./406_CI_CD.md) - CI/CDパイプライン
- [410_Infrastructure.md](./410_Infrastructure.md) - インフラ（Supabase Test DB）

### ツール・運用

- [408_AI.md](./408_AI.md) - AI活用
- [409_Release.md](./409_Release.md) - リリース・メンテナンス
- [411_Reference.md](./411_Reference.md) - リファレンス（コマンド・トラブルシューティング）

---

**関連ドキュメント:**
- [単体テスト戦略](../500_Unit_Test/Unit_Test_Strategy.md)
- [結合テスト戦略](../600_Integration_Test/Integration_Test_Strategy.md)
- [E2Eテスト戦略](../700_E2E_Test/E2E_Test_Strategy.md)
- [コーディング規約（概要）](../300_Cording/301_CodingStandards.md)
