# AGENTS.md - Parcel Tracking

## プロジェクト概要

荷物追跡 Web アプリ。複数キャリアの追跡番号を検出し、配送状況を一覧表示します。現行のViteエントリは `index.html` → `src/main.jsx` → `src/App.jsx` です。

## 技術スタック

- React / JSX / CSS / JavaScript（ES Modules）
- Vite（ビルド・開発サーバー）
- Bun（ランタイム・パッケージマネージャー）
- Lism CSS（`lism-css/react` のレイアウトコンポーネント + npm CSS）
- Cloudflare Worker（ステータス取得の任意プロキシ）・ブラウザ LocalStorage

## ビルド・実行コマンド

```bash
# 依存関係インストール
bun install

# 開発サーバー起動
bun run dev

# 本番ビルド・ローカルプレビュー
bun run build
bun run preview

# package.json の全テストスクリプト
bun run test

# ドメインロジックの回帰テスト（現在のテストファイル）
bun test tests/logic.test.mjs

# Workerのfixtureテスト
node workers/smoke-test.mjs
node workers/yamato-test.mjs
```

Workerの構文確認は、変更したファイルに対して次を実行します。

```bash
for file in carrier.js detector.js validator.js url-builder.js storage.js scraper.js workers/tracking-worker.js; do node --check "$file" || exit 1; done
```

## ファイル構造

- `index.html` - ViteのHTMLエントリ
- `src/main.jsx` / `src/App.jsx` - Reactエントリ、UI、状態、イベント処理
- `global.css` - Lism CSSのカスタムレイヤー、レスポンシブスタイル
- `carrier.js` - 11キャリアの定義、形式、追跡URL
- `detector.js` - 一意な形式だけを自動検出（曖昧な数字列は `null`）
- `validator.js` - キャリア別の追跡番号バリデーション
- `url-builder.js` - URL構築、キャリアラベル、共有用フォーマット
- `storage.js` - `savedTrackings` のLocalStorage管理（最大8件）
- `scraper.js` - 本番Workerへのステータス照会
- `tests/logic.test.mjs` - Bunのドメインロジック回帰テスト
- `workers/tracking-worker.js` - Cloudflare Worker本体
- `workers/wrangler.toml` - Worker名・エントリ・互換性日付
- `.github/workflows/static.yml` - Bunビルド後のGitHub Pagesデプロイ

ルートの `main.js` は旧バニラJS実装として残っています。現行UIの変更は `src/App.jsx` と `src/main.jsx` に行い、共通ロジックはルートのヘルパーモジュールを再利用します。

## コードスタイル

- Prettier 使用（CIの確認コマンドは `npx prettier --check . || true`）。
- インデント：スペース 2 個。
- UIは関数コンポーネントとHooksで実装し、レイアウトはLismのプリミティブ/ユーティリティと `global.css` のカスタムCSSを組み合わせます。
- キャリア定義を `carrier.js` に集約します。`detector.js` は `CARRIERS` を走査し、複数形式に一致する番号を推測しません。
- 入力のハイフンは除去して照会・URL生成します。詳細入力のサイズ・個口は数字以外を除去します。
- 現行の確認方法は `check-status`（初期値、📡）と `show-url`（URL）の2つです。URL表示の見出しは「共有用にコピーする」です。
- React側はユーザー入力をテキストとして描画します。旧 `main.js` やHTMLフォーマットを変更するときは、既存の `escapeHtml()` を維持し、未エスケープの `innerHTML` を追加しません。

## Cloudflare Worker

```bash
cd workers
bunx wrangler deploy
npx wrangler secret put DHL_API_KEY
```

`DHL_API_KEY` はDHL公式Tracking API用のWorker Secretであり、ソース・README・ログへ書き込みません。Workerは日本郵便、佐川、ヤマト、オカケン、OCSをHTMLパースし、DHLは公式APIを使います。それ以外は `unavailable` になり得ます。

## Pitfalls

- `.github/workflows/ci.yml` のESLint/Prettierは `|| true` 付きで、失敗してもCIを止めない補助チェックです。`package.json` にlintスクリプトはありません。
- GitHub Pagesは `main` へのpushで `.github/workflows/static.yml` が `bun install --frozen-lockfile` → `bun run build` → `dist/`公開を行います。`dist/`、`node_modules/`、`.wrangler/`、`.env*` は生成物・ローカル状態・秘密情報としてコミットしません。
- `scraper.js` には本番Worker URLが設定済みです。別環境へ切り替える場合だけ `WORKER_URL` を変更します。
- ステータス確認は全キャリア照会です。未対応キャリアや未設定/権限不備のDHL APIは `unavailable` / `errors` になり、URL表示モードとは別経路です。
- `global.css` のモバイル境界は `max-width: 480px`、ボタン・入力のタッチ領域は最低 `2.75rem` です。`prefers-reduced-motion` ではアニメーションを抑制します。
