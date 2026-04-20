## ADDED Requirements

### Requirement: `_glossary.yaml` でプロジェクト共通の用語集を管理する

`.modscape/specs/_glossary.yaml` はプロジェクト横断の用語定義を保持するファイルとする。各エントリは一意の `id`（kebab-case）と `definition` を必須とし、`label`（日本語名等）・`tables`・`columns`・`change`・`date` はオプションとする。

```yaml
terms:
  - id: net_revenue
    label: "純売上"
    definition: "discount_amount控除後・税抜きの売上金額"
    tables: [fct_orders, mart_daily_revenue]
    columns: [fct_orders.net_revenue]
    change: revenue-pipeline-v2
    date: "2026-02-10"
```

#### Scenario: 最小構成で用語を登録する
- **WHEN** `id` と `definition` のみを持つエントリが `_glossary.yaml` に存在する
- **THEN** パーサーはそのエントリを有効な `GlossaryTerm` として返す

#### Scenario: ファイルが存在しない場合は空として扱う
- **WHEN** `.modscape/specs/_glossary.yaml` が存在しない
- **THEN** パーサーは `{ terms: [] }` を返し、エラーを投げない

### Requirement: `modscape init --sdd` で `_glossary.yaml` 空テンプレートを生成する

`modscape init --sdd` 実行時、`_context.yaml` と並んで `.modscape/specs/_glossary.yaml` の空テンプレートを生成する。ファイルが既に存在する場合は上書き確認を行う（`safeWriteFile` の既存挙動と同じ）。

#### Scenario: init --sdd で _glossary.yaml が生成される
- **WHEN** `modscape init --sdd` を実行し、`_glossary.yaml` が存在しない
- **THEN** `.modscape/specs/_glossary.yaml` が `terms: []` を含むテンプレートとして生成される

#### Scenario: 既存ファイルはスキップされる
- **WHEN** `modscape init --sdd` を実行し、`_glossary.yaml` が既に存在する
- **THEN** ファイルを上書きせずスキップメッセージを表示する
