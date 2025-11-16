# PWA アイコン実装ガイド

## 概要

PWA機能を有効にするには、以下のアイコンファイルが必要です。本ドキュメントでは、PWAアイコンの要件と実装方法について説明します。

---

## 必要なアイコンファイル

以下のアイコンファイルを `public/` ディレクトリに配置してください：

- `icon-192x192.png` - 192x192ピクセルのアイコン
- `icon-512x512.png` - 512x512ピクセルのアイコン

---

## アイコンの要件

### 形式とサイズ

- **形式**: PNG形式
- **サイズ**: 
  - 192x192ピクセル（必須）
  - 512x512ピクセル（必須）
- **purpose**: `any maskable` - Androidのアダプティブアイコンに対応
- **背景**: 透明背景または単色背景

### マスク可能アイコン（Maskable Icon）

Androidのアダプティブアイコンに対応するため、`purpose: "any maskable"` を指定します。これにより、Androidデバイスでアイコンがより美しく表示されます。

**マスク可能アイコンの要件：**
- アイコンの中心部分（約80%）に重要な要素を配置
- 外側20%はマスクされる可能性があるため、重要な情報を配置しない

---

## アイコンの作成方法

### 1. デザインツールでの作成

1. デザインツール（Figma、Adobe Illustratorなど）でアイコンをデザイン
2. 192x192と512x512のサイズでエクスポート
3. `public/` ディレクトリに配置

### 2. オンラインツールの利用

以下のオンラインツールを使用してアイコンを生成することも可能です：

- [PWA Asset Generator](https://github.com/elegantapp/pwa-asset-generator)
- [RealFaviconGenerator](https://realfavicongenerator.net/)

---

## manifest.json での設定

アイコンは `manifest.json` で以下のように設定します：

```json
{
  "icons": [
    {
      "src": "/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

---

## 注意事項

### 必須要件

- アイコンが存在しない場合、PWAのインストールができない場合があります
- アイコンはアプリのブランドを表現する重要な要素です
- マスク可能なアイコン（maskable icon）として作成すると、Androidでより美しく表示されます

### ベストプラクティス

- **一貫性**: アプリのブランドアイデンティティと一致させる
- **視認性**: 小さなサイズでも認識しやすいデザイン
- **シンプル**: 複雑すぎるデザインは避ける
- **コントラスト**: 背景とのコントラストを確保

---

## 関連ドキュメント

- [PWA機能設計](../202_DetailedDesign/204_DetailedDesign_Functions.md#48-pwa機能将来実装)
- [PWAアーキテクチャ](../202_DetailedDesign/202_DetailedDesign_Architecture.md#25-pwa構成将来実装)

