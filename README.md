# 📦 Parcel Tracking App

配送番号を入力するだけで、各配送業者の追跡ページへワンクリックでアクセスできる Web アプリケーションです。

## 機能

- **9 配送業者対応** — 佐川急便 / ヤマト運輸 / 西濃運輸 / 福山通運 / オカケン / DHL / OCS / YDH / 日本郵便
- **自動業者検出** — 配送番号の形式から入力中に配送業者を自動判定（日本郵便・DHL は形式で確定、12 桁の場合は手動選択）
- **3 つの確認モード**
  - **ページ遷移** — 生成した追跡 URL を新しいタブで直接開く
  - **URL 表示** — 業者名・追跡番号・URL を表示しワンクリックでコピー
  - **📡 ステータス確認** — Cloudflare Worker 経由で配送状況を取得（別途 Worker デプロイが必要）
- **入力バリデーション** — 業者ごとに適切な桁数・形式をチェック
- **履歴保存** — 確認した追跡番号を LocalStorage に保存（最大 8 件）。クリックで再アクセス、✕ で削除
- **ハイフン自動除去** — 入力されたハイフンは自動で取り除かれます
- **メモ機能** — 各追跡番号に任意のメモ（品番・発送先など）を添えて保存

## 対応配送業者

| 業者 | 識別子 | 形式 |
|------|--------|------|
| 🚚 佐川急便 | `sagawa` | 数字 12 桁 |
| 🐈 ヤマト運輸 | `yamato` | 数字 12 桁 |
| 🦘 西濃運輸 | `seino` | 数字 12 桁 |
| 🌅 福山通運 | `fukutsu` | 数字 12 桁 |
| 🦺 オカケン | `okaken` | 数字 12 桁 |
| 🛩️ DHL | `dhl` | 数字 10 桁 |
| 🌐 OCS | `ocs` | — |
| 🐼 YDH | `ydh` | 数字 12 桁 |
| 🏣 日本郵便 | `japanpost` | `XX000000000JP` / 数字 11 桁 |

> 12 桁の番号は佐川 / ヤマト / 西濃 / 福山通運 / オカケン / YDH で競合するため、自動検出は行わず手動選択が必要です。

## 使い方

1. **配送業者を選択** — ボタンをクリック
2. **配送番号を入力** — ハイフン込みでも OK
3. **メモを入力（任意）** — 品番や発送先など
4. **確認モードを選択**
   - `ページ遷移` → 即座に追跡サイトへ
   - `URL表示` → URL を表示してコピー可能に
   - `📡 確認` → ステータス情報を画面に表示（Worker 要デプロイ）
5. **「配送状況を確認」をクリック**

## ファイル構成

```
parcel-tracking/
├── index.html          # メイン UI
├── global.css          # スタイル定義
├── main.js             # UI 制御・イベントハンドリング
├── carrier.js           # 配送業者定義・URL 生成ロジック
├── detector.js          # 配送番号からの業者自動検出
├── validator.js         # 入力形式バリデーション
├── url-builder.js       # 表示用 URL 構築
├── storage.js           # LocalStorage 保存・管理
├── scraper.js           # Cloudflare Worker 経由のステータス取得
└── workers/
    ├── tracking-worker.js  # Cloudflare Worker（ステータススクレイピング）
    ├── wrangler.toml       # Worker 設定
    └── workflows/          # Worker ワークフロー定義
```

## 開発

### 必要条件

- [Bun](https://bun.sh/)（ランタイム・パッケージ管理）

### セットアップ

```bash
bun install
```

開発用ローカルサーバー:

```bash
bun run index.html
```

または任意の静的ファイルサーバーで `index.html` を配信してください。

### Cloudflare Worker のデプロイ

`📡 確認` モードを使用するには、Cloudflare Worker のデプロイが必要です。

```bash
cd workers
bunx wrangler deploy
```

デプロイ後、`scraper.js` 内の `WORKER_URL` に Worker の URL を設定してください。

## 技術スタック

- **言語**: HTML / CSS / JavaScript (ES Modules)
- **ランタイム**: Bun
- **ステータス取得**: Cloudflare Workers（オプション）
- **ストレージ**: ブラウザ LocalStorage
- **外部依存ゼロ** — CDN やフレームワークに依存しない Pure JS

## ライセンス

プライベートプロジェクト / 特に明示なし
