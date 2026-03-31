# relationship-id Specification

## Purpose
The system SHALL support an optional `id` field on both `relationships` and `lineage` entries to enable stable referencing, deduplication, and annotation targeting.

## Requirements

### Requirement: Relationship ID Field
Each entry in the `relationships` array MAY carry an optional `id` field (string). When present, it uniquely identifies the relationship within the model and enables annotation targeting and CLI-level deduplication.

#### Scenario: Relationship with id
- **WHEN** a `relationships` entry has an `id` field (e.g., `id: rel_orders_customers`)
- **THEN** the parser SHALL preserve the `id` on the relationship object and expose it for annotation targeting and CLI operations

#### Scenario: Relationship without id
- **WHEN** a `relationships` entry has no `id` field
- **THEN** the system SHALL behave identically to before, with no errors or warnings

### Requirement: Lineage ID Field
Each entry in the `lineage` array MAY carry an optional `id` field (string). When present, it uniquely identifies the lineage edge within the model.

#### Scenario: Lineage entry with id
- **WHEN** a `lineage` entry has an `id` field (e.g., `id: lin_orders_summary`)
- **THEN** the parser SHALL preserve the `id` and expose it for annotation targeting

#### Scenario: Lineage entry without id
- **WHEN** a `lineage` entry has no `id` field
- **THEN** the system SHALL behave identically to before, with no errors or warnings

### Requirement: Column Array Support on Relationships
The `relationships[].from` and `relationships[].to` objects SHALL support a `columns` array field as an alternative to the single `column` field, allowing a relationship to reference multiple columns (composite foreign key).

#### Scenario: Single-column relationship (existing behavior)
- **WHEN** a relationship entry uses `column: customer_id` (singular)
- **THEN** the parser SHALL continue to accept it as a valid single-column reference

#### Scenario: Multi-column relationship
- **WHEN** a relationship entry uses `columns: [order_id, line_no]`
- **THEN** the parser SHALL treat it as a composite key reference across the specified columns

#### Scenario: Mixed single and array column fields
- **WHEN** a relationship's `from` uses `column` and `to` uses `columns`
- **THEN** the parser SHALL accept each side independently without error

### Requirement: CLI Deduplication by ID
The CLI `relationship` commands SHALL use the `id` field for deduplication when adding or removing relationships. If an `id` is provided on `relationship add`, and an existing entry with the same `id` already exists, the command SHALL update the existing entry rather than adding a duplicate.

#### Scenario: Add relationship with duplicate id
- **WHEN** `modscape relationship add` is called with an `id` that already exists in the YAML
- **THEN** the CLI SHALL update the existing entry and NOT append a new duplicate

#### Scenario: Remove relationship by id
- **WHEN** `modscape relationship remove` is called with an `--id` flag
- **THEN** the CLI SHALL remove the matching entry by `id`, regardless of `from`/`to` values

#### Scenario: Deduplication falls back to from/to when no id
- **WHEN** a relationship entry has no `id`
- **THEN** deduplication SHALL fall back to matching by `from.table`, `from.column`, `to.table`, and `to.column`
