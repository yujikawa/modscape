## Purpose
The system SHALL support an optional `implementation` block per table in the YAML, providing code-generation hints for AI agents targeting dbt, Spark, SQLMesh, and other data transformation tools.

## Requirements

### Requirement: Implementation Block Declaration
Each table in the YAML SHALL support an optional `implementation` block that declares code-generation hints for AI agents.

#### Scenario: Table with full implementation block
- **WHEN** a table has an `implementation` block with `materialization`, `partition_by`, and `measures`
- **THEN** the parser SHALL preserve all fields as-is and expose them on the `Table` object

#### Scenario: Table without implementation block
- **WHEN** a table has no `implementation` block
- **THEN** the system SHALL behave identically to before, with no errors or warnings

#### Scenario: Table with partial implementation block
- **WHEN** a table has an `implementation` block with only `materialization` defined
- **THEN** the parser SHALL preserve the partial block without requiring other fields

### Requirement: Materialization Declaration
The `implementation` block SHALL support a `materialization` field to declare how the table is physically materialized.

#### Scenario: Incremental table declaration
- **WHEN** a table has `implementation.materialization: incremental` and `implementation.unique_key: [order_id]`
- **THEN** an AI agent SHALL generate an incremental model configuration using `order_id` as the merge key

#### Scenario: View declaration
- **WHEN** a table has `implementation.materialization: view`
- **THEN** an AI agent SHALL generate a view definition rather than a physical table

### Requirement: Unique Key Declaration
The `implementation` block SHALL support a `unique_key` field that declares the column(s) used for deduplication in incremental models. The canonical form is an **array of strings** (e.g., `unique_key: [order_id]`). A scalar string (e.g., `unique_key: order_id`) is also accepted for convenience and SHALL be normalized to a single-element array by the parser.

#### Scenario: Incremental table with unique_key array
- **WHEN** a table has `implementation.unique_key: [order_id, line_no]`
- **THEN** an AI agent SHALL use both columns as a composite merge key

#### Scenario: Scalar unique_key normalization
- **WHEN** a table has `implementation.unique_key: order_id` (scalar string)
- **THEN** the parser SHALL normalize it to `["order_id"]` for consistent internal representation

### Requirement: Partition Declaration
The `implementation` block SHALL support a `partition_by` field for warehouse-level physical partitioning hints. The canonical form is a **single object** with `field` and optional `granularity` (`day` / `month` / `year` / `hour`), e.g., `partition_by: { field: event_date, granularity: day }`. An array form is also accepted for multi-field partitioning and SHALL be preserved as-is.

#### Scenario: Date-partitioned table (object form)
- **WHEN** a table has `implementation.partition_by: { field: event_date, granularity: day }`
- **THEN** an AI agent SHALL apply a day-level partition on `event_date` in the generated DDL or model config

#### Scenario: Multiple partition fields (array form)
- **WHEN** a table has two entries in `partition_by` as an array
- **THEN** an AI agent SHALL apply partitioning on all specified fields in order

### Requirement: Cluster-By Declaration
The `implementation` block SHALL support an optional `cluster_by` field that declares the column(s) used for physical clustering in the warehouse (e.g., BigQuery `CLUSTER BY`). The value SHALL be an **array of strings**.

#### Scenario: Clustered table
- **WHEN** a table has `implementation.cluster_by: [customer_id, region_id]`
- **THEN** an AI agent SHALL generate clustering on `customer_id` and `region_id` in the warehouse DDL or model config

#### Scenario: Table without cluster_by
- **WHEN** a table has no `implementation.cluster_by` field
- **THEN** the system SHALL behave identically to before, with no errors or warnings

### Requirement: Measures Declaration for Mart Tables
The `implementation` block SHALL support a `measures` array for mart tables to declare aggregation logic.

#### Scenario: Mart with sum measure
- **WHEN** a mart table has a measure `{ column: total_revenue, agg: sum, source_column: amount }`
- **THEN** an AI agent SHALL generate `SUM(<upstream>.amount) AS total_revenue` in the SELECT clause

#### Scenario: Mart with count_distinct measure
- **WHEN** a mart table has a measure `{ column: unique_customers, agg: count_distinct, source_column: customer_id }`
- **THEN** an AI agent SHALL generate `COUNT(DISTINCT <upstream>.customer_id) AS unique_customers`

#### Scenario: Grain declaration drives GROUP BY
- **WHEN** a mart table has `implementation.grain: [month_key, region_id]`
- **THEN** an AI agent SHALL generate `GROUP BY month_key, region_id` in the aggregation query

### Requirement: AI Inference Fallback
When `implementation` is absent, AI agents SHALL infer materialization strategy from `appearance.type` and `appearance.scd`.

#### Scenario: Fact table without implementation block
- **WHEN** a table has `appearance.type: fact` and no `implementation` block
- **THEN** an AI agent SHALL infer `materialization: incremental`

#### Scenario: Dimension with SCD Type 2 without implementation block
- **WHEN** a table has `appearance.type: dimension` and `appearance.scd: type2` and no `implementation` block
- **THEN** an AI agent SHALL infer snapshot-style materialization

#### Scenario: Mart table without implementation block
- **WHEN** a table has `appearance.type: mart` and no `implementation` block
- **THEN** an AI agent SHALL infer `materialization: table`
