## MODIFIED Requirements

### Requirement: archiveスキルの Step 5 で decisions に ids を付与する

archiveスキルの Step 5（`_context.yaml` の更新）において、decisions を書き込む際に `ids` フィールドを付与しなければならない（SHALL）。`ids` の値は Step 2 で分類した Affected Tables の ID リスト（Direct Impact + Downstream Impact — Implement + Downstream Impact — Context Only）とする。

Affected Tables が空の場合（`design.md` に `## Affected Tables` セクションがない場合）は `ids` フィールドを省略してよい（MAY）。

```yaml
# decisions の書き込みフォーマット
- id: D-NNN
  summary: "<one-line summary>"
  rationale: "<why this decision was made>"  # optional
  date: <YYYY-MM-DD>
  change: <name>
  ids: [<affected-entity-id>, ...]           # Step 2 のAffected Tablesから
```

#### Scenario: Affected Tables が存在する場合に ids を付与する
- **WHEN** `design.md` の `## Affected Tables` に `fct_orders`（Direct Impact）が記載されており、decisionsを書き込む
- **THEN** decision エントリに `ids: [fct_orders]` が含まれる

#### Scenario: Affected Tables が空の場合は ids を省略する
- **WHEN** `design.md` に `## Affected Tables` セクションが存在しない
- **THEN** decision エントリに `ids` フィールドは含まれない

## MODIFIED Requirements

### Requirement: archiveスキルの glossary パースで ids フィールドを使用する

archiveスキルが `glossary.md` を `_glossary.yaml` にマージする際、エンティティ参照フィールドとして `tables` ではなく `ids` を使用しなければならない（SHALL）。

#### Scenario: glossary.md の ids フィールドが _glossary.yaml に正しくマージされる
- **WHEN** `glossary.md` に `ids: [fct_orders]` を持つ用語エントリが存在する
- **THEN** `_glossary.yaml` の該当エントリに `ids: [fct_orders]` が書き込まれる

#### Scenario: 既存エントリの更新時も ids フィールドが保持される
- **WHEN** 既存の `_glossary.yaml` エントリ（`ids: [fct_orders]`）に対して同一IDの用語が `glossary.md` に存在する
- **THEN** マージ後も `ids` フィールドが正しく保持される
