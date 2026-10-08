---
version: alpha
name: Always Yesterday Party
description: 深い内海の静けさにオレンジの信号灯を置く、AYP共通のブランド／プロダクト設計。
colors:
  primary-navy: "#0B1F3A"
  primary-ink: "#0F172A"
  signal-orange: "#F97316"
  sea-mid: "#1B4F72"
  sea-deep: "#072742"
  surface: "#FFFFFF"
  canvas: "#F8FAFC"
  border: "#E2E8F0"
  muted: "#6B7280"
  success: "#15803D"
typography:
  display-lg:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Noto Sans JP, sans-serif"
    fontSize: "72px"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.025em"
  display-sm:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Noto Sans JP, sans-serif"
    fontSize: "48px"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Noto Sans JP, sans-serif"
    fontSize: "36px"
    fontWeight: 700
    lineHeight: 1.1
  title:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Noto Sans JP, sans-serif"
    fontSize: "20px"
    fontWeight: 700
    lineHeight: 1.4
  body:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Noto Sans JP, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
  body-sm:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Noto Sans JP, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Noto Sans JP, sans-serif"
    fontSize: "12px"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.1em"
rounded:
  control: "8px"
  logo: "12px"
  card: "16px"
  full: "9999px"
spacing:
  xxs: "4px"
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
  xl: "40px"
  section-sm: "56px"
  section-lg: "80px"
components:
  app-header:
    backgroundColor: "{colors.primary-navy}"
    textColor: "{colors.surface}"
    typography: "{typography.title}"
    rounded: "{rounded.card}"
    padding: "16px 24px"
  button-primary:
    backgroundColor: "{colors.primary-navy}"
    textColor: "{colors.surface}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.full}"
    padding: "12px 24px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.signal-orange}"
    textColor: "{colors.primary-navy}"
  button-signal:
    backgroundColor: "{colors.signal-orange}"
    textColor: "{colors.primary-navy}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.full}"
    padding: "12px 24px"
    height: "44px"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.primary-navy}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.full}"
    padding: "12px 24px"
    height: "44px"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.primary-ink}"
    rounded: "{rounded.card}"
    padding: "24px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.primary-ink}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "12px 16px"
    height: "44px"
  chip-selected:
    backgroundColor: "{colors.primary-navy}"
    textColor: "{colors.surface}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.full}"
    padding: "8px 12px"
---

# Design System: Always Yesterday Party

## Overview

**Creative North Star: "The Inner Sea Signal"**

AYPの画面は、瀬戸内の内海のように静かで深いネイビーの場に、必要な瞬間だけオレンジの信号が灯るものとする。音楽レーベルの余韻と、現場で本当に使う道具の明快さを同居させる。装飾で「クリエイティブらしさ」を演じず、強い配色、余白、実物の作品や機能でAYPらしさを出す。

ブランドサイトでは内海のグラデーション、波、リップル、作品画像を大きく使ってよい。アプリでは同じモチーフをヘッダー、フォーカス、選択状態などの狭い面積に抑え、作業面は白と淡いキャンバスに戻す。音楽アプリのレコード、配送アプリの荷物、印刷アプリのプリンターなど、機能固有の手掛かりは残す。

既存ロゴは白地に黒一色の、太い手描き線とピクセル状の「AYP」を組み合わせた正方形アートである。画像そのものを使い、描き直し、彩色、簡略化、別書体による代替ロゴは行わない。ロゴが置けない環境では「Always Yesterday Party」または「AYP」の文字と小さなオレンジの点だけで表す。

**Key Characteristics:**
- 深いネイビーの土台と、希少なオレンジの信号
- 白い作業面、明確な境界、読みやすいシステムサンセリフ
- 角丸カードと完全なピルを役割で使い分ける形状語彙
- ブランド面は大胆、プロダクト面は静かで操作優先
- 黒白の既存ロゴと、各アプリ固有の機能記号を両立

## Colors

パレットは「深い水面＋信号灯」。ネイビーが構造、白が作業面、オレンジが注意と進行方向を担う。

### Primary
- **Deep AYP Navy** (`primary-navy`): ヘッダー、主要ボタン、選択状態、濃色セクションに使う。白文字とのコントラストは16.52:1。
- **AYP Ink** (`primary-ink`): 白／淡色面の本文、見出し、データに使う。
- **Signal Orange** (`signal-orange`): フォーカス、リンク下線、小さな点、強調アクションに限定する。ネイビー文字とのコントラストは5.89:1。

### Secondary
- **Inner Sea Mid** (`sea-mid`): ブランドサイトの水面と、アプリヘッダーの補助色。
- **Inner Sea Deep** (`sea-deep`): ネイビーから沈む背景階調。単独で操作状態を表さない。

### Neutral
- **Surface** (`surface`): カード、入力、作業領域。
- **Canvas** (`canvas`): 作業面の背後に敷く淡い背景。
- **Quiet Border** (`border`): 入力、カード、区切り線。
- **Muted Copy** (`muted`): 補足文、メタデータ。白上で4.83:1を確保する。
- **Success** (`success`): 成功・公開中など、意味が成功である場合だけ使う。

**The Signal Light Rule.** オレンジは一画面の10%以下に抑える。常時広く塗るのではなく、次に見る場所を示す。

**The Two-Contrast Rule.** 白文字はネイビーに、オレンジ面の文字はネイビーに置く。白文字をSignal Orangeへ直接置く組み合わせは2.80:1しかないため禁止する。

**The Platform Color Rule.** Spotify、YouTube、配送区分、エラー等の外部／意味色は、その意味を失わない範囲で保持する。AYPオレンジへ一律置換しない。

## Typography

**Display / Body Font:** OSのシステムサンセリフを使う。Webは `ui-sans-serif, system-ui`、WindowsはSegoe UI、日本語はNoto Sans JP・Hiragino Sans・Meiryo等のプラットフォームフォールバックに任せる。

**Character:** 太い見出しと静かな本文の一族構成。外部フォントを追加して個性を作らず、配色、余白、ロゴ、作品で固有性を担う。

### Hierarchy
- **Display** (`display-lg` / `display-sm`): ブランドサイトのH1専用。大画面72px、小画面48px、最大でも96pxを超えない。
- **Headline** (`headline`): ブランドサイトの主要セクション見出し。アプリでは使わない。
- **Title** (`title`): カードタイトル、アプリタイトル、重要な結果見出し。
- **Body** (`body`): 標準本文と入力。長文は65–75ch以内。
- **Body Small** (`body-sm`): 補助説明、ボタン、メタデータ。
- **Label** (`label`): 種別や短いカテゴリだけに使う。全大文字は短い英字ラベルに限定し、全セクションへ反射的に置かない。

**The One Family Rule.** 1画面では同じシステムサンセリフ系を使い、表示書体で操作UIを飾らない。

**The Weight Carries Voice Rule.** AYPの見出しは700、本文は400、操作ラベルは600を基本とする。字間を詰め過ぎず、表示見出しでも `-0.025em` より狭くしない。

## Layout

ブランドサイトは最大幅1152pxの中央コンテナを基準にし、セクション間は56–80px、カード内は24pxを使う。作品画像は規則的なグリッドで見せ、ヒーローは一画面を使ってもよい。

Webアプリは作業の主線を1本にする。タスク面の最大幅は用途に応じて544–720pxとし、入力→選択→実行→結果の順序を縦に保つ。WinUI等のデスクトップアプリはプラットフォームのコマンドバー、リスト、ダイアログ、スクロールを優先し、AYPのために標準操作を作り直さない。

8pxを基本単位、4pxを微調整として使う。モバイルでは左右16px以上を確保し、二列の操作群は一列へ積む。本文や見出しを縮めるだけで済ませず、構造を切り替える。タッチ操作は44px以上、デスクトップの密な補助操作でも32px未満にしない。

**The One Workstream Rule.** プロダクト画面は主タスクを一列に通す。カードを増やして工程を分断しない。

**The Brand-at-the-Edge Rule.** アプリの内海モチーフはヘッダー、ページ外周、選択状態に置き、入力・結果・データの背後へ敷かない。

## Elevation & Depth

基本の奥行きは色面と1px境界で作る。アプリの常設面はフラットで、ホバー時も色と1–2pxの移動に留める。ブランドサイトの作品画像や単独のマーケティング面だけ、`0 10px 30px rgba(2, 6, 23, 0.10)` の柔らかな影を使ってよい。

**The One Depth Cue Rule.** 同じ要素に広い影と1px境界を装飾として併用しない。アプリは境界、浮かせるブランド面は影のどちらか一方を選ぶ。

**The Flat Until Needed Rule.** ドロップ中、ホバー、フォーカス、モーダルなど状態が変わる瞬間だけ奥行きを増やす。常時浮遊するガラス面は作らない。

## Shapes

カード／大きな面は16px、ロゴ画像は12px、入力や矩形コントロールは8pxを基本とする。主要ボタン、短いチップ、外部サービスの丸いアイコンだけを完全なピル／円にする。

**The Role Before Radius Rule.** 丸さは役割を示す。コンテナは穏やかな角丸、操作はピル、入力は小さな角丸。カードを24–40pxへ過剰に丸めない。

**The Untouched Logo Rule.** ロゴ画像の外形だけを12pxで整え、中の黒い線画へ色、影、マスク、アニメーションを加えない。

## Components

### App Header
- ネイビー面に白いアプリ名、オレンジの小点または短い `AYP DEVELOPMENT` ラベルを置く。
- ロゴ資産が既にある場合のみ40px前後の正方形で使う。資産追加が重い／不自然な環境では文字表記を使う。
- ブランドサイトへのリンクはヘッダーまたはフッターに一つ置き、主タスクより強くしない。

### Buttons
- **Primary:** ネイビー面＋白文字。高さ44px以上、完全なピル。画面の主操作は原則一つ。
- **Signal:** オレンジ面＋ネイビー文字。連絡、公開、決定など強い一回性のアクションに限る。
- **Secondary:** 白または透明面＋ネイビー文字＋Quiet Border。
- **Hover / Active:** ネイビーとオレンジを入れ替えるか、明度を一段変え、移動は1–2px以内。
- **Focus:** オレンジの3pxリングを2px外側へ置く。色だけで状態を伝えない。
- **Disabled / Loading:** コントラストを落としつつ、ラベルで状態を明記する。

### Cards / Containers
- 16pxの角丸、24pxの内部余白。アプリでは白面＋Quiet Border、ブランド面では影のみを選べる。
- カード内カードは禁止。グループ化には余白、見出し、区切り線を使う。

### Inputs / Fields
- 高さ44px以上、8pxの角丸、白面、Quiet Border。本文と同じ16pxを基本にする。
- フォーカスはSignal Orange、エラーは専用の意味色と文言を併用する。
- プレースホルダーも4.5:1を下回らない。

### Chips / Segmented Controls
- 短い選択肢だけをピルにする。未選択は白、選択はネイビー＋白。
- 発送／受取、配信サービス等の意味色は選択の意味がある場合だけ保持する。

### Navigation
- ブランドサイトは白いスティッキーヘッダー、ネイビー文字、オレンジのホバーを使う。
- アプリは標準の戻る、タブ、コマンドバーを優先する。独自ナビゲーションを足さない。

### Motion
- アプリは160–250msの状態遷移だけを使う。
- ブランドサイトは600–1100msのヒーロー／作品リビールを使ってよいが、コンテンツはアニメーション前から読める状態にする。
- `prefers-reduced-motion` では即時または短いクロスフェードにする。

## Do's and Don'ts

### Do:
- **Do** Deep AYP Navy、Signal Orange、白い作業面の三役を一貫して使う。
- **Do** オレンジ面にはネイビー文字、ネイビー面には白文字を置く。
- **Do** 既存の黒白ロゴ画像を改変せず、正方形のまま使う。
- **Do** 各アプリ固有の機能記号と標準プラットフォーム操作を残す。
- **Do** 44px以上の操作領域、明示的なフォーカス、Reduced Motion、意味のある空状態を維持する。
- **Do** 新しい画面を作る前に既存トークン、CSS変数、ThemeResourceを探して再利用する。

### Don't:
- **Don't** Signal Orangeへ白い通常サイズ文字を置く。コントラスト不足になる。
- **Don't** 紫／ピンクのネオングラデーション、グラデーション文字、装飾的グラスモーフィズムをAYPアプリに使う。
- **Don't** ベージュ／グレージュをAYPの共通キャンバスとして使う。ブランドの内海と信号灯が消える。
- **Don't** 既存ロゴを描き直す、着色する、丸く切り抜く、別書体の「AYP」で置き換える。
- **Don't** 1px境界と16px以上の広い影を同じカードに重ねる。
- **Don't** 24px以上のカード角丸、入れ子カード、全セクションの小さな全大文字キッカーを反射的に使う。
- **Don't** 成功、エラー、配送区分、外部サービスの意味色をすべてオレンジへ置換する。
- **Don't** スタイルのためだけに新しい依存関係、抽象コンポーネント、共有パッケージを追加する。
