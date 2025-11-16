# コーディング規約（概要）

## 概要

本ドキュメントは、auriary プロジェクトにおけるコーディング規約の概要を定めたものです。

フレームワークに依存しない、プロジェクト全体で統一されたコーディング規約を定義し、コードの品質、可読性、保守性を向上させることを目的とします。

---

## コーディング規約の目的

1. **コードの一貫性**：プロジェクト全体で統一されたスタイル
2. **可読性の向上**：誰が読んでも理解しやすいコード
3. **保守性の向上**：変更が容易で、バグが発生しにくいコード
4. **チーム開発の効率化**：コードレビューが容易になり、開発速度が向上

---

## コーディング規約の構成

詳細なコーディング規約は以下のドキュメントを参照してください：

- [302_TypeScript.md](./302_TypeScript.md) - TypeScript コーディング規約
- [311_SchemaDesign.md](./311_SchemaDesign.md) - スキーマ設計（Zod）
- [303_NamingConventions.md](./303_NamingConventions.md) - 命名規則・ファイル構造
- [304_GitConventions.md](./304_GitConventions.md) - Git コミット規約
- [305_ComponentDesign.md](./305_ComponentDesign.md) - コンポーネント設計原則
- [306_ErrorHandling.md](./306_ErrorHandling.md) - エラーハンドリング規約
- [307_Logging.md](./307_Logging.md) - ログ記録規約
- [308_Testing.md](./308_Testing.md) - テスト方針
- [309_CodeReview.md](./309_CodeReview.md) - コードレビュー方針
- [310_Documentation.md](./310_Documentation.md) - ドキュメントコメント規約

---

## 基本原則

### 1. 明確性を優先

- コードは自己文書化を心がける
- 複雑なロジックにはコメントを追加
- 変数名・関数名は意図が明確になるように命名

### 2. 単一責任の原則

- 関数・コンポーネントは1つの責任のみを持つ
- 長すぎる関数は分割する
- 再利用可能な単位で分割

### 3. DRY（Don't Repeat Yourself）

- 重複コードを避ける
- 共通処理は関数・コンポーネントとして抽出
- ただし、過度な抽象化は避ける

### 4. 型安全性の確保

- TypeScript の型を最大限に活用
- `any` の使用を避ける
- 型推論を活用しつつ、必要な箇所では明示的に型を指定

### 5. エラーハンドリング

- エラーは適切に処理する
- エラーメッセージは明確で有用なものにする
- エラーログを適切に記録

---

## ツールと設定

### ESLint

- コード品質を自動チェック
- プロジェクト全体で統一されたルールを適用

**設定ファイル:**
- `eslint.config.mjs` - ESLint 9のフラット設定形式を使用

**主要な設定:**
- TypeScriptファイル（`.ts`, `.tsx`）にはTypeScriptパーサーを使用
- JavaScriptファイル（`.js`, `.jsx`）には標準パーサーを使用
- ビルド生成ファイル（`.next/`, `.open-next/`, `public/sw.js`など）は除外

**トラブルシューティング:**

#### ESLint 9とNext.js 16の互換性問題

**問題:**
- `next lint`コマンドが`lint`ディレクトリを探すエラー
- `FlatCompat`を使用した際の循環参照エラー
- `.eslintrc.json`と`eslint.config.mjs`の併用エラー

**解決方法:**

1. **ESLint 9のフラット設定形式を使用**
   - `eslint.config.mjs`を使用（`.eslintrc.json`は使用しない）
   - `@typescript-eslint/eslint-plugin`と`@typescript-eslint/parser`をインストール

2. **TypeScriptファイルとJavaScriptファイルを分離**
   ```javascript
   // eslint.config.mjs
   {
     files: ['**/*.{ts,tsx}'],
     languageOptions: {
       parser: typescriptParser,
       parserOptions: {
         project: './tsconfig.json',
       },
     },
   },
   {
     files: ['**/*.{js,jsx}'],
     // TypeScriptパーサーは使用しない
   }
   ```

3. **ビルド生成ファイルを除外**
   ```javascript
   ignores: [
     'node_modules/**',
     '.next/**',
     '.open-next/**',  // OpenNext.jsのビルド出力
     'out/**',
     'dist/**',
     'build/**',
     'coverage/**',
     '*.config.{js,mjs,ts}',
     'scripts/**',
     'public/sw.js',  // Service Worker
     'cloudflare-env.d.ts',  // 自動生成ファイル
   ]
   ```

4. **ルールの調整**
   - `no-console`: 開発中は`off`に設定（本番環境では`warn`推奨）
   - `@typescript-eslint/no-explicit-any`: 必要に応じて`off`に設定
   - `@typescript-eslint/no-unused-vars`: `argsIgnorePattern: '^_'`で未使用引数を許可

**注意事項:**
- ESLint 9では`.eslintrc.json`形式は非推奨（フラット設定形式のみ）
- `next lint`コマンドはNext.js 16では削除されている可能性があるため、`eslint .`を直接使用
- `FlatCompat`を使う場合は循環参照エラーに注意

**推奨設定例:**

```javascript
// eslint.config.mjs
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      '.open-next/**',  // OpenNext.jsのビルド出力
      'out/**',
      'dist/**',
      'build/**',
      'coverage/**',
      '*.config.{js,mjs,ts}',
      'scripts/**',
      'public/sw.js',  // Service Worker
      'cloudflare-env.d.ts',  // 自動生成ファイル
    ],
  },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: typescriptParser,
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
        project: './tsconfig.json',
      },
    },
    plugins: {
      '@typescript-eslint': typescriptEslint,
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'off', // 開発中はconsole.logを許可
      'no-debugger': 'warn',
    },
  },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {
      'no-console': 'off',
      'no-debugger': 'warn',
    },
  },
];
```

**必要な依存関係:**
```json
{
  "devDependencies": {
    "eslint": "^9",
    "@typescript-eslint/eslint-plugin": "^8.46.4",
    "@typescript-eslint/parser": "^8.46.4",
    "eslint-config-next": "^16.0.0"
  }
}
```

**package.jsonのlintスクリプト:**
```json
{
  "scripts": {
    "lint": "eslint ."
  }
}
```

### Prettier

- コードフォーマットを自動化
- インデント、改行、引用符などを統一

### TypeScript

- 型チェックを厳格に設定
- `strict: true` を推奨

---

## コードレビュー

- すべてのコード変更はレビューを経る
- コーディング規約に準拠しているか確認
- [309_CodeReview.md](./309_CodeReview.md) を参照

---

## ドキュメント

- 複雑なロジックにはコメントを追加
- 公開APIにはJSDocコメントを記述
- [310_Documentation.md](./310_Documentation.md) を参照

---

**関連ドキュメント:**
- [基本設計書](../100_BasicDesign/100_BasicDesign.md)
- [Next.js 16 実装方針（概要）](./321_NextJS_Implementation_Overview.md)

**コーディング規約（フレームワーク非依存）:**
- [TypeScript コーディング規約](./302_TypeScript.md)
- [命名規則・ファイル構造](./303_NamingConventions.md)
- [Git コミット規約](./304_GitConventions.md)
- [コンポーネント設計原則](./305_ComponentDesign.md)
- [エラーハンドリング規約](./306_ErrorHandling.md)
- [ログ記録規約](./307_Logging.md)
- [テスト方針](./308_Testing.md)
- [コードレビュー方針](./309_CodeReview.md)
- [ドキュメントコメント規約](./310_Documentation.md)

---

## コーディング規約の更新

コーディング規約は、プロジェクトの成長に合わせて更新されます。
重要な変更時は、チーム全体に通知し、既存コードへの影響を確認します。

