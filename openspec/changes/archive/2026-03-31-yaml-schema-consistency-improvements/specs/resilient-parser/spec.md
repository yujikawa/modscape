## ADDED Requirements

### Requirement: sampleData ヘッダー行の自動検出と警告

パーサーは `sampleData` の最初の行がすべて文字列であり、かつテーブルの `columns` の `id` リストと完全一致する場合、それをヘッダー行と判断する。
ヘッダー行を検出した場合、パーサーはコンソールに警告を出力し、その行を除去した `sampleData` を返す。

#### Scenario: ヘッダー行を含む sampleData が正規化される
- **WHEN** `sampleData` の最初の行が `[customer_hk, customer_bk, record_source]` であり、テーブルの column id リストと完全一致する
- **THEN** パーサーはその行を除去し、残りの行のみを `sampleData` として返し、コンソールに警告を出力する

#### Scenario: ヘッダー行を含まない sampleData はそのまま保持される
- **WHEN** `sampleData` の最初の行がデータ値（数値・日付等を含む）である
- **THEN** パーサーはすべての行をそのまま保持し、警告を出力しない

#### Scenario: column id リストと一致しない最初の行はヘッダー行として扱われない
- **WHEN** `sampleData` の最初の行がすべて文字列だが、テーブルの column id リストと一致しない
- **THEN** パーサーはヘッダー行と判断せず、その行を保持する

### Requirement: Relationship.type から 'lineage' 値を除去

`Relationship.type` の有効な値は `one-to-one | one-to-many | many-to-one | many-to-many` の4種のみとする。
`'lineage'` は `Relationship.type` の有効な値ではなく、TypeScript 型定義からも除去する。

#### Scenario: 有効な cardinality type を持つ relationship は正常にパースされる
- **WHEN** relationship エントリの `type` が `one-to-many` である
- **THEN** パーサーはこれを正常に処理する

#### Scenario: type が 'lineage' の relationship はパーサーが警告を出す
- **WHEN** relationship エントリの `type` が `lineage` である
- **THEN** パーサーはコンソールに警告を出力し、そのエントリを無効として扱う

## MODIFIED Requirements

### Requirement: Loose Schema Normalization
The system SHALL normalize YAML data by providing default empty structures for missing optional sections (`columns`, `relationships`, `conceptual`).

root-level の `version` フィールドが存在する場合、パーサーはこれを `schema.version` として保持する。

#### Scenario: Table with only ID and Name
- **WHEN** the YAML contains a table with only `id` and `name`
- **THEN** the parser generates a table object where `columns` is an empty array and `conceptual` is an empty object

#### Scenario: root-level version フィールドを持つ YAML が正常にパースされる
- **WHEN** YAML の root に `version: "2"` が存在する
- **THEN** パーサーはこれを `schema.version` として保持しエラーを出さない
