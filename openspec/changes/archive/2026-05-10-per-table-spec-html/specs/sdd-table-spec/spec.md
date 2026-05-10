## MODIFIED Requirements

### Requirement: テーブル単位の恒久ビジネス仕様書フォーマットを定義する
`.modscape/specs/<model-slug>/` 配下にテーブルごとのフラットファイルとしてビジネス仕様を記述する恒久的なドキュメントを配置しなければならない（SHALL）。

**保存先パス（SHALL）:**
- `specs/<model-slug>/<table-id>.html`（html モード）
- `specs/<model-slug>/<table-id>.md`（md モード）
- `specs/<model-slug>/<table-id>.questions.md`（Q&A、常に Markdown）

`<model-slug>` はテーブルが属する main YAML ファイル名から拡張子を除いた値（例: `main-model1.yaml` → `main-model1`）。html/md の混在は許容する（SHALL）。

**md フォーマット — 必須セクション（SHALL）:**
- `# <table-id>` — ファイル冒頭のタイトル
- `## Overview` — Owner / Update Frequency / SLA のメタ情報
- `## Business Context` — ビジネス上の意味・用途
- `## Changelog` — 変更履歴

**html フォーマット（SHALL）:**
- `src/templates/spec/html/table-spec-template.html` を雛形として生成する
- テーブル ID・grain・ビジネスルール・依存関係・Changelog を含む
- インライン CSS を使用し、外部リソースに依存しない

両フォーマットとも `model.yaml` の `conceptual.description` とは役割が異なり、ステークホルダー向けの詳細なビジネス文書として機能しなければならない（SHALL）。

#### Scenario: html モードで生成された spec.html が正しいパスに作成される
- **WHEN** html モードで archive が `fct_orders` の spec を生成し、モデルスラグが `main-model1` の場合
- **THEN** `specs/main-model1/fct_orders.html` が生成される

#### Scenario: md モードで生成された spec.md が正しいパスに作成される
- **WHEN** md モードで archive が `fct_orders` の spec を生成し、モデルスラグが `main-model1` の場合
- **THEN** `specs/main-model1/fct_orders.md` が生成される

#### Scenario: html と md が同じモデルスラグ配下に混在できる
- **WHEN** 一部のテーブルは `fct_orders.html`、別のテーブルは `dim_customers.md` が存在する
- **THEN** 両方が `/api/context/tables` から正常に取得できる
