## MODIFIED Requirements

### Requirement: `_glossary.yaml` でプロジェクト共通の用語集を管理する

`.modscape/specs/_glossary.yaml` はプロジェクト横断の用語定義を保持するファイルとする。各エントリは一意の `id`（kebab-case）と `definition` を必須とし、`label`・`ids`・`columns`・`change`・`date` はオプションとする。

`ids` フィールドはこの用語が参照するエンティティID（テーブル・リレーション・ドメイン・メトリクス等）のリストとする。旧フィールド名 `tables` は廃止する。

```yaml
terms:
  - id: net_revenue
    label: "純売上"
    definition: "discount_amount控除後・税抜きの売上金額"
    ids: [fct_orders, mart_daily_revenue]
    columns: [fct_orders.net_revenue]
    change: revenue-pipeline-v2
    date: "2026-02-10"
```

#### Scenario: ids フィールドで任意エンティティを参照する
- **WHEN** `ids: [fct_orders, rel_orders_customers]` を持つエントリが `_glossary.yaml` に存在する
- **THEN** パーサーはそのエントリを有効な `GlossaryTerm` として返す

#### Scenario: ids を省略した最小構成で用語を登録する
- **WHEN** `id` と `definition` のみを持つエントリが `_glossary.yaml` に存在する
- **THEN** パーサーはそのエントリを有効な `GlossaryTerm` として返す

## REMOVED Requirements

### Requirement: `terms[].tables` フィールド
**Reason**: `ids` に統一。テーブル以外のエンティティ参照にも対応するため。
**Migration**: `tables: [foo, bar]` → `ids: [foo, bar]` にリネームする。
