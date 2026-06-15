## MODIFIED Requirements

### Requirement: loadContext が ids フィールドでエンティティ参照を読み取る

`src/export.js` の `loadContext` 関数は、`_glossary.yaml` の `terms[].ids`、`_questions.yaml` の `questions[].ids`、`_context.yaml` の `decisions[].ids` を読み取らなければならない（SHALL）。旧フィールド名（`tables`・`table`）は読み取らない。

#### Scenario: _glossary.yaml の ids フィールドを正しく読み取る
- **WHEN** `terms[].ids: [fct_orders, mart_daily_revenue]` を持つ `_glossary.yaml` を `loadContext` で読み込む
- **THEN** 返り値の `glossary[].ids` に `['fct_orders', 'mart_daily_revenue']` が含まれる

#### Scenario: _questions.yaml の ids フィールドを正しく読み取る
- **WHEN** `questions[].ids: [fct_orders]` を持つ `_questions.yaml` を `loadContext` で読み込む
- **THEN** 返り値の `questions[].ids` に `['fct_orders']` が含まれる

#### Scenario: _context.yaml の ids フィールドを正しく読み取る
- **WHEN** `decisions[].ids: [fct_orders]` を持つ `_context.yaml` を `loadContext` で読み込む
- **THEN** 返り値の `decisions[].ids` に `['fct_orders']` が含まれる

#### Scenario: ids を持たないエントリは空配列として扱う
- **WHEN** `ids` フィールドを持たないエントリを `loadContext` で読み込む
- **THEN** 該当エントリの `ids` は `[]` または `undefined` として返され、エラーは発生しない
