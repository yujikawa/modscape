## ADDED Requirements

### Requirement: cluster_by フィールドのサポート

`implementation` ブロックは、オプションの `cluster_by` フィールドをサポートする。
`cluster_by` の値はカラム ID の文字列配列とする。
このフィールドはウェアハウスのクラスタリングキーを AI エージェントへのヒントとして宣言する。

#### Scenario: cluster_by を持つテーブルが正常にパースされる
- **WHEN** テーブルに `implementation.cluster_by: [customer_id, region_id]` が指定されている
- **THEN** パーサーはこれを保持し、`table.implementation.cluster_by` として配列が返される

#### Scenario: cluster_by を持つ fact テーブルから AI が DDL を生成する
- **WHEN** fact テーブルに `implementation.cluster_by: [customer_id]` が指定されている
- **THEN** AI エージェントはクラスタリングキーとして `customer_id` を適用した DDL または model config を生成する

## MODIFIED Requirements

### Requirement: Partition Declaration
The `implementation` block SHALL support a `partition_by` array for warehouse-level physical partitioning hints. Each entry has a `field` and an optional `granularity` (`day` / `month` / `year` / `hour`).

YAML 内では単一オブジェクト形式 `partition_by: { field: ..., granularity: ... }` および配列形式の両方を受け付ける。パーサーは単一オブジェクト形式を配列に正規化する。rules.md は配列形式を正規形として記載する。

#### Scenario: Date-partitioned table
- **WHEN** a table has `implementation.partition_by: [{ field: event_date, granularity: day }]`
- **THEN** an AI agent SHALL apply a day-level partition on `event_date` in the generated DDL or model config

#### Scenario: 単一オブジェクト形式の partition_by が配列に正規化される
- **WHEN** YAML に `partition_by: { field: event_date, granularity: day }` と記述されている（配列でない）
- **THEN** パーサーはこれを `[{ field: event_date, granularity: day }]` に正規化する

#### Scenario: Multiple partition fields
- **WHEN** a table has two entries in `partition_by`
- **THEN** an AI agent SHALL apply partitioning on all specified fields in order

### Requirement: Materialization Declaration
The `implementation` block SHALL support a `materialization` field to declare how the table is physically materialized.

`unique_key` フィールドは文字列（単一キー）および文字列配列（複合キー）の両方を受け付ける。パーサーは文字列を配列に正規化する。rules.md は配列形式を正規形として記載する。

#### Scenario: Incremental table declaration with array unique_key
- **WHEN** a table has `implementation.materialization: incremental` and `implementation.unique_key: [order_id]`
- **THEN** an AI agent SHALL generate an incremental model configuration using `order_id` as the merge key

#### Scenario: 文字列形式の unique_key が配列に正規化される
- **WHEN** YAML に `unique_key: order_id` と記述されている（文字列形式）
- **THEN** パーサーはこれを `["order_id"]` に正規化する

#### Scenario: View declaration
- **WHEN** a table has `implementation.materialization: view`
- **THEN** an AI agent SHALL generate a view definition rather than a physical table
