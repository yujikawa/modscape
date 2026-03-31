# Model Format Changelog

This file tracks changes to the `model.yaml` format specification.
The current version is defined in `src/model-format-version.js`.

Format version is recorded in the `version` field at the root of `model.yaml`.

---

## [2.0.0]

### Added
- `version` field (root-level, optional string) — records the model format version
- `relationships[].id` field (optional string) — stable identifier; parser auto-generates as `rel-{from}.{cols}-{to}.{cols}` or `rel-{from}-{to}-{type}` if omitted
- `lineage[].id` field (optional string) — stable identifier; parser auto-generates as `lin-{from}-{to}` if omitted
- `implementation.cluster_by` field (`string[]`) — clustering key hints for code generation
- `annotations[].targetType` now accepts `'lineage'` in addition to existing values

### Changed
- `relationships[].from.column` / `to.column` now accepts `string | string[]`; parser normalizes to `string[]` (composite key support)
- `annotations[].targetType: 'relationship'` now requires the relationship to have an explicit `id` field to be useful

### Fixed
- `relationships[].type: 'lineage'` was an invalid value that could appear in older files; parser now warns and discards such entries

### Removed
- `relationships[].type` no longer accepts `'lineage'` as a valid value

---

## [1.x]

Initial format. No formal versioning was applied.
