## ADDED Requirements

### Requirement: SCD Type2 の列役割を明示できる
`implementation` に `scd2` サブセクションを追加し、SCD Type2 ディメンションの実装に必要な列役割（ビジネスキー・有効期間・カレントフラグ）を明示できなければならない（SHALL）。

`implementation.scd2` は `appearance.scd: type2` が設定されているテーブルでのみ使用する（SHALL）。

`scd2` は以下のフィールドを持たなければならない（SHALL）:
- `business_key` (array of string, required): 自然キーとなる列 ID のリスト
- `valid_from` (string, required): 有効開始日を格納する列 ID
- `valid_to` (string, required): 有効終了日を格納する列 ID
- `current_flag` (string, optional): 現在レコードを示すフラグ列 ID

`scd2` セクション全体は省略可能（SHALL）。省略時は SDD implement スキルが列名から推測する（後退互換）。

#### Scenario: scd2 フィールドから SCD Type2 の SQL を生成する
- **WHEN** `appearance.scd: type2` かつ `implementation.scd2` が設定されている
- **THEN** SDD implement スキルは `business_key` でレコードを識別し、`valid_from` / `valid_to` / `current_flag` を使用した SCD Type2 マージ SQL を生成する

#### Scenario: business_key が複数列の場合に対応する
- **WHEN** `scd2.business_key: [customer_id, product_id]` のように複数列が指定されている
- **THEN** SDD implement スキルは複合キーとして JOIN 条件を組み立てる

#### Scenario: scd2 が省略された場合は従来の推測挙動を維持する
- **WHEN** `appearance.scd: type2` だが `implementation.scd2` が設定されていない
- **THEN** SDD implement スキルは列名から推測してコードを生成し、不明な場合は TODO コメントを出力する（後退互換）
