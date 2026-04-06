## ADDED Requirements

### Requirement: テーブル単位の恒久ビジネス仕様書フォーマットを定義する
`.modscape/specs/<table-id>.md` はテーブルのビジネス仕様を記述する恒久的なドキュメントであり、以下のセクション構造に従わなければならない（SHALL）。

必須セクション（SHALL）:
- `# <table-id>` — ファイル冒頭のタイトル（model.yamlのテーブルIDと一致）
- `## Overview` — Owner / Update Frequency / SLA のメタ情報
- `## Business Context` — テーブルのビジネス上の意味・用途
- `## Changelog` — SDD作業名と日付の変更履歴

任意セクション（MAY）:
- `## Business Rules` — ビジネスルール・計算ロジック
- `## Known Issues / Caveats` — 既知の問題・注意点

このフォーマットは `model.yaml` の `conceptual.description`（AI向けの簡潔な記述）とは役割が異なり、ステークホルダー向けの詳細なビジネス文書として機能しなければならない（SHALL）。

#### Scenario: archiveスキルが新規specを作成する
- **WHEN** `/modscape:sdd:archive` が新規テーブルのspecを生成する
- **THEN** 上記フォーマットに従った `specs/<table-id>.md` が作成される

#### Scenario: specの内容がmodel.yamlのテーブルIDと一致する
- **WHEN** `specs/fct_orders.md` が存在する
- **THEN** ファイル名の `fct_orders` は `model.yaml` の `tables[].id` に存在するテーブルIDと一致する

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
