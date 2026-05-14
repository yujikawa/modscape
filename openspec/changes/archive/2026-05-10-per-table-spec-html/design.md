## Context

現在の SDD ワークフローでは、`output_format: html` を設定すると変更成果物（spec.html / design.html / tasks.html）は HTML で生成される。しかし archive スキルが生成する per-table 恒久 spec（`.modscape/specs/<table-id>/spec.md`）は "always Markdown" と明示されており、フォーマットが揃っていない。

また、specs ディレクトリがフラット構造（`specs/<table-id>/`）のため、複数モデルを持つプロジェクトでテーブル ID が衝突する問題がある。

`dev.js` はすでに `.modscape/specs/<table-id>/spec.md` をテキストとして返す `/api/context/tables` エンドポイントを持ち、ContextPanel の Specs タブで `<pre>` 表示している。`_context.yaml` / `_glossary.yaml` / `_questions.yaml` は構造化 YAML データなので今回の変更対象外。

## Goals / Non-Goals

**Goals:**
- html モード時に archive が `specs/<model-slug>/<table-id>/spec.html` を生成する
- specs ディレクトリ構造を `<model-slug>/<table-id>/` 方式に変更し、複数モデルでの衝突を解消する
- `dev.js` が `spec.html` を認識し、ContextPanel で iframe 表示する
- md モードは現状維持（後方互換）
- フォールバック設計（`spec.html` 優先 → `spec.md` にフォールバック）

**Non-Goals:**
- `_context.yaml` / `_glossary.yaml` / `_questions.yaml` の HTML 対応
- 深いネスト（`specs/**/`）への対応
- 既存フラット構造の自動マイグレーション（archive 時に案内するにとどめる）
- Gemini / Codex 版スキルへの即時同期

## Decisions

### 1. specs ディレクトリ構造を `<model-slug>/` 直下フラットファイル方式に変更する

**決定:** テーブルごとのサブディレクトリを廃止し、`specs/<model-slug>/<table-id>.html`（html モード）または `specs/<model-slug>/<table-id>.md`（md モード）のフラットファイル方式を採用する。questions は `specs/<model-slug>/<table-id>.questions.md` として同じフラット構造に置く。html/md の混在は許容する。

```
.modscape/specs/
  _context.yaml
  _glossary.yaml
  _questions.yaml
  main-model1/
    fct_orders.html           ← html モード spec
    dim_customers.md          ← md モード spec（混在OK）
    fct_orders.questions.md   ← questions（常にMarkdown）
  main-model2/
    fct_campaigns.html
```

**理由:** テーブルごとにサブディレクトリを作るのは過剰。ファイル名で種別を表現できる（`.html` vs `.md`）。フラット構造のほうが `readdirSync` で単純にスキャンでき、実装もシンプル。

**model-slug の導出:**
- 通常パス: `spec-config.yaml` の `main_yamls` から `path.parse(filePath).name`
  （例: `models/main-model1.yaml` → `main-model1`）
- グリーンフィールドパス: ユーザーがアーカイブ時に指定した出力パスから導出

**代替案:** テーブルサブディレクトリ方式（`<model-slug>/<table-id>/spec.html`）→ ディレクトリ数が増え冗長なため却下。

### 2. `/api/context/tables` は表示中のモデルスラグで絞り込む

**決定:** `GET /api/context/tables?model=<slug>` のようにモデルスラグをクエリパラメータで受け取り、`specs/<slug>/` 配下をスキャンする。スラグ未指定の場合は `specs/` 直下をフォールバックとして従来の動作を保つ。

**スキャンロジック:** `<table-id>.html` → `specIsHtml: true`、`<table-id>.md` → `specIsHtml: false`、`<table-id>.questions.md` → `questions` フィールドとして付加。`<table-id>.html` が存在する場合は `.md` より優先。

**理由:** フラットファイル方式なので `readdirSync` 1回でファイル一覧を取得しパースできる。

### 3. spec.html は iframe で表示する

**決定:** `TableSpecSection` は `specIsHtml === true` のとき `<pre>` の代わりに `<iframe>` で表示する。HTML は `/api/table-spec/:modelSlug/:tableId` エンドポイントで配信し、light モード CSS 注入（LIGHT_MODE_CSS）を適用する。

**理由:** AI が生成する HTML はインライン CSS を持つ自己完結型。spec-dev-viewer（SpecPanel）と同じ iframe 方式を再利用できる。

### 4. フォールバック設計

**決定:** `/api/context/tables` は `.html` → `.md` の順で探す。混在プロジェクト（html 移行前のテーブルが残っている）でも全テーブルが表示できる。

### 5. per-table 用 HTML テンプレートを追加する

**決定:** `src/templates/spec/html/table-spec-template.html` を新規作成し、archive スキルが参照してテーブル仕様書を生成する。既存の変更成果物テンプレート（spec-template.html 等）と同じ配置場所・方針。

## Risks / Trade-offs

- **[リスク] 既存フラット構造との非互換** → archive 時にフラット形式の既存ファイルを検出し、`specs/<slug>/<table-id>/` への移動を案内する。自動移動は行わない（ユーザー判断に委ねる）。
- **[リスク] dev.js がモデルスラグを知らない** → 現在の `/api/files` レスポンスにスラグ情報があるため、フロント側から `model` クエリパラメータとして渡せる。
- **[トレードオフ] spec.html の Git diff がノイジー** → 変更成果物と同様の既知トレードオフとして受け入れる。
- **[トレードオフ] Gemini / Codex 版スキルは即時非同期** → Claude 版を先行実装し、後から反映（CLAUDE.md の方針通り）。
