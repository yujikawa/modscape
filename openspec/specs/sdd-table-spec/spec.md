## ADDED Requirements

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

### Requirement: specs/ディレクトリの進捗をJSONで確認できる
AIまたはツールは `model.yaml` のテーブルリストと `specs/` ディレクトリを照合し、specの有無・最終更新日を含む進捗情報をJSON形式で返せなければならない（SHALL）。

各エントリには以下を含まなければならない（SHALL）:
- `table_id` — テーブルID
- `has_spec` — specファイルの有無（boolean）
- `spec_path` — specファイルのパス（存在する場合）
- `last_updated` — specの最終更新日（存在する場合）

#### Scenario: 全テーブルのspec進捗を確認する
- **WHEN** model.yaml に5テーブルが存在し specs/ に3ファイルが存在する状態で進捗確認を実行する
- **THEN** 5件のエントリが返され、specがないテーブルは `has_spec: false` として表示される

#### Scenario: すべてのテーブルにspecが存在する場合
- **WHEN** model.yaml の全テーブルに対応する `specs/<table-id>.md` が存在する
- **THEN** 全エントリが `has_spec: true` で返される
