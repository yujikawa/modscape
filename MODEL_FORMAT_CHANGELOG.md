# Model Format Changelog

This file tracks changes to the `model.yaml` format specification.
The current version is defined in `src/model-format-version.js`.

Format version is recorded in the `version` field at the root of `model.yaml`.

---

## [2.1.0]

### Added
- `metrics[]` — new optional top-level array for defining business KPIs and calculated measures. Each entry has `id` (string, required), `name` (string, required), `expression` (string, optional — free-form formula), and `description` (string, optional).
- `lineage[].to` now accepts a metric `id` in addition to a table `id`, enabling data flow arrows from source tables to metric nodes.

Existing `model.yaml` files without a `metrics:` key are fully compatible — no migration needed.

---

## [2.0.0]

### Added
- `version: "2.0.0"` — root-level version field is now required; omitting it or specifying `"1.0.0"` causes a parse error with a `modscape migrate` hint
- `tables[].conceptual` — business layer: `name`, `kind` (fact|dimension|mart|hub|link|satellite|table), `description`, `tags`
- `tables[].logical` — analytic layer: `name`, `grain`, `scd` (object with `type`, `business_key`, `valid_from`, `valid_to`, `current_flag`)
- `tables[].physical` — build/storage layer: `name`, `strategy`, `update_mode`, `merge_key`, `partition`, `cluster`, `filter_key`, `lookback`, `measures`
- `tables[].display` — visual layer: `icon`, `color`
- `tables[].metadata` — arbitrary key-value pairs (replaces `conceptual.tags`)
- `columns[].expression` — optional SQL expression for the column
- `columns[].physical` — optional physical override: `name`, `type`, `constraints`
- `lineage[].join_type` — optional join hint: `inner|left|cross|none`
- `domains[].display.color` — domain background color (replaces `domains[].color`)
- `consumers[].display` — consumer visual settings: `icon`, `color` (replaces `consumers[].appearance`)
- `annotations[].target` — attachment target as `{ id, type }` object (replaces flat `targetId`/`targetType`)
- `annotations[].display.color` — annotation background color (replaces `annotations[].color`)
- `modscape migrate` CLI command — migrates v1 YAML files to v2 in-place (with `.bak` backup), supports `--out` and `--dry-run`

### Changed
- `tables[].columns` — flat structure; `logical:` wrapper on columns is removed
- `physical.merge_key` — normalized from `string` to `string[]`
- `physical.cluster` — normalized from `string` to `string[]`
- `physical.partition` — normalized from array to single object
- `layout` — `parentId` removed from layout entries; domain membership is declared via `domains[].members` only

### Removed
- `tables[].name` — replaced by `conceptual.name`
- `tables[].logical_name` — replaced by `logical.name`
- `tables[].physical_name` — replaced by `physical.name`
- `tables[].appearance` — replaced by `conceptual` + `display`
- `tables[].implementation` — replaced by `physical` (and `logical.scd` for SCD fields)
- `columns[].logical` wrapper — fields promoted to top level
- `annotations[].type` (sticky|callout) — removed entirely
- `annotations[].targetId` / `annotations[].targetType` — replaced by `annotations[].target`
- `annotations[].color` — replaced by `annotations[].display.color`
- `domains[].color` — replaced by `domains[].display.color`
- `consumers[].appearance` — replaced by `consumers[].display`
- `layout[id].parentId` — removed; use `domains[].members` to declare membership

---

## [1.0.0]

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
