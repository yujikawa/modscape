## MODIFIED Requirements

### Requirement: CLI Deduplication by ID
The CLI `relationship` commands SHALL use the `id` field for deduplication when adding or removing relationships. If an `id` is provided on `relationship add`, and an existing entry with the same `id` already exists, the command SHALL warn and skip rather than appending a duplicate.
`relationship get` and `relationship update` commands SHALL also accept `--id` as the primary selector for single-entry operations.

#### Scenario: Add relationship with duplicate id
- **WHEN** `modscape relationship add` is called with an `id` that already exists in the YAML
- **THEN** the CLI SHALL warn that the relationship already exists and skip without modification

#### Scenario: Remove relationship by id
- **WHEN** `modscape relationship remove` is called with an `--id` flag
- **THEN** the CLI SHALL remove the matching entry by `id`, regardless of `from`/`to` values

#### Scenario: Deduplication falls back to from/to when no id
- **WHEN** a relationship entry has no `id`
- **THEN** deduplication SHALL fall back to matching by `from.table` and `to.table`

#### Scenario: Get relationship by id
- **WHEN** `modscape relationship get` is called with an `--id` flag
- **THEN** the CLI SHALL return the matching relationship entry

#### Scenario: Update relationship by id
- **WHEN** `modscape relationship update` is called with an `--id` flag
- **THEN** the CLI SHALL update only the matching entry, leaving all other entries unchanged
