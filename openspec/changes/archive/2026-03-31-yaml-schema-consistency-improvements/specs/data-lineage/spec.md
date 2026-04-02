## MODIFIED Requirements

### Requirement: Lineage Definition
The system SHALL support defining upstream dependencies in the YAML model using the top-level `lineage` section, where both `from` and `to` values may reference either a table ID or a consumer ID.

`lineage` エントリは、オプションの `id`、`type` フィールドを持てる。

#### Scenario: Defining upstream tables
- **WHEN** a `lineage` entry references table IDs in both `from` and `to`
- **THEN** the system recognizes these as data flow dependencies between tables

#### Scenario: Lineage to a consumer node
- **WHEN** a `lineage` entry has a `to` value that matches a consumer ID (and not a table ID)
- **THEN** the system resolves the target as a consumer node and renders a lineage arrow to it

#### Scenario: fact テーブルを lineage ソースとして使用できる
- **WHEN** `from: fct_orders`（fact テーブル）で lineage エントリが定義されている
- **THEN** システムはこれを正当なデータフローとして処理し、エラーや警告を出さない

## REMOVED Requirements

### Requirement: lineage ソースの種別を制限するルール（誤ったルール）
**Reason**: `lineage` セクションはデータフローの**表現方法**を規定するものであり、何をソース・ターゲットにするかはユーザーが決める。rules.md が規定すべきは「lineage を `relationships` に書いてはならない」という書き方の制約のみ。どのテーブルタイプをつなぐかを rules.md が制限するのは誤り。
**Migration**: rules.md Section 4 の「MUST NOT define lineage entries for raw tables as sources」という記述を削除する。残すルールは「lineage の接続を `relationships` セクションに重複して書いてはならない」のみ。
