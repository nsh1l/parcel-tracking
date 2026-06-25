# AGENTS.md - Parcel Tracking

## プロジェクト概要
荷物追跡 Web アプリ。複数キャリアの追跡番号を検出し、配送状況を一覧表示。

## 技術スタック
- HTML / CSS / JavaScript（バニラ JS）
- Bun（パッケージマネージャー）

## ビルド・実行コマンド
```bash
# 依存関係インストール
bun install

# 開発サーバー起動
bun run dev

# ビルド
bun run build
```

## ファイル構造
- `index.html` - メインページ
- `main.js` - アプリロジック
- `detector.js` - キャリア検出
- `carrier.js` - キャリア情報
- `scraper.js` - 配送状況スクレイピング

## コードスタイル
- Prettier 使用
- インデント：スペース 2 個