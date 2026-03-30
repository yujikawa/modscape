## ADDED Requirements

### Requirement: Table ID Rename
The system SHALL allow users to rename a table's `id` from the DetailPanel, and SHALL update all references within the same YAML schema.

#### Scenario: Successful table ID rename
- **WHEN** the user edits the table ID field in the DetailPanel and the new ID is non-empty and not already used
- **THEN** the table `id` is updated
- **AND** all references in `layout`、`domains[].members`、`relationships[].from.table`、`relationships[].to.table`、`lineage[].from`、`lineage[].to`、`annotations[].targetId` are updated to the new ID

#### Scenario: Duplicate table ID
- **WHEN** the user enters an ID that already exists in the schema
- **THEN** the system displays an error and does NOT apply the rename

#### Scenario: Empty table ID
- **WHEN** the user clears the ID field (empty string or whitespace only)
- **THEN** the system does NOT apply the rename and reverts to the original ID

### Requirement: Column ID Rename
The system SHALL allow users to rename a column's `id` from the DetailPanel, and SHALL update all column references within the same YAML schema.

#### Scenario: Successful column ID rename
- **WHEN** the user edits a column ID field in the DetailPanel and the new ID is non-empty and not duplicate within the table
- **THEN** the column `id` is updated
- **AND** all references in `relationships[].from.column` and `relationships[].to.column` that match the old column ID within the same table are updated

#### Scenario: Duplicate column ID within table
- **WHEN** the user enters a column ID that already exists in the same table
- **THEN** the system displays an error and does NOT apply the rename
