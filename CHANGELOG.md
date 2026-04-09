# Changelog

All notable changes to this project will be documented in this file.

## [2.7.2] - 2026-04-09

### Added
- **Detail Panel keyboard shortcuts** — Keyboard shortcuts for the Detail Panel:
  - `Enter` — Opens the Detail Panel for the currently selected table / edge / annotation.
  - `Escape` — Closes the Detail Panel.
  - `1`–`5` — Switches tabs (Conceptual / Logical / Physical / Implementation / Sample Data) when a table is selected. The shortcut number is shown as a subtle hint on each tab.

### Changed
- **Detail Panel floating window** — The Detail Panel is now a freely movable and resizable floating overlay (inspired by TerminalBar). It no longer pushes the canvas when opened.
  - Default size: 600×340px (landscape), centered on screen at first open.
  - Drag via the colored title bar; resize from the bottom-right corner handle.
  - Opened explicitly via the "Open Details" button in SelectionToolbar (single-node selection only).
  - Closing triggers: × button in title bar, Esc key, or clicking empty canvas.
- **Annotation click opens Detail Panel automatically** — Clicking a sticky note / annotation now opens the Detail Panel immediately, without requiring the SelectionToolbar button flow (annotations have no other editing surface).
- **Detail Panel header redesign** — Each panel type (table, domain, annotation, etc.) now shows a slim colored drag bar at the top matching the entity's theme color, with a grip icon on the left and × close button on the right.
- **Copy ID button moved** — The copy icon now appears immediately before `ID: {id}` text so they stay visually adjacent regardless of panel width.
- **Metadata selectors layout** — Table type / sub-type / SCD selectors are stacked below the table name (column direction) to prevent overlapping when the panel is narrow.
- **Tab overflow handling** — When the Detail Panel is too narrow to show all tabs (Conceptual / Logical / Physical / Implementation / Sample Data), they collapse into a compact select dropdown.

## [2.7.1] - 2026-04-08

### Fixed
- **Edge connect mode restored** — The Lineage / ER edge drawing mode (introduced in v2.5.2) was accidentally removed when the Terminal Bar replaced the Command Palette in v2.6.0. Restored in full:
  - **ActivityBar buttons**: `Spline+` (Lineage, `L`) and `Network+` (ER, `R`) buttons are back in the left sidebar.
  - **Keyboard shortcuts**: `L` toggles Lineage connect mode; `R` toggles ER connect mode; `Esc` exits either mode.
  - **`FROM` badge**: when in connect mode and a source node is selected, a green `FROM` badge appears on the node card.
  - **Green highlight**: all nodes display a green border while a connect mode is active; the pending source node is highlighted more prominently.

### Changed
- **Relationship cardinality in Detail Panel** — The 1/N labels are no longer rendered as Cytoscape edge text (unreliable visibility, especially in light mode). Instead, when an ER edge is selected the cardinality is shown in the Detail Panel header in the format `tableName [N] — [1] tableName`, both in the expanded panel and in the minimized bottom bar.
- **`modscape merge --patch` flag** — New `--patch` mode for the `merge` command. Uses the first file (master YAML) as the base and upserts subsequent files in-place, preserving the master's table array order. Prevents spurious delete+add git diffs that occurred when spec-model tables were prepended to the output array. Archive workflow now uses `modscape merge <master>.yaml <spec-model>.yaml --output <master>.yaml --patch`.
- **SDD spec file renamed** — The work-scoped model file scaffolded by `/modscape:spec:new` is now named `spec-model.yaml` (was `model.yaml`) for clarity.

## [2.7.0] - 2026-04-07

### Added
- **SDD workflow redesign** — Restructured the SDD workflow to separate temporary work artifacts from permanent table specs, and to support data-specific design loops.
  - **Named work folders**: Each pipeline now gets its own folder `sdd/<name>/` (requirements proposes the name, user confirms). Multiple pipelines can run in parallel.
  - **`/modscape:sdd:archive <name>`** — New skill that syncs permanent table specs to `.modscape/specs/<table-id>.md`. Directly affected tables get full spec updates; upstream tables get Changelog-only entries. Prompts user to optionally delete the work folder.
  - **`/modscape:sdd:design <name>` (enhanced)** — Now reads `specs/*.md` for existing business context, auto-identifies directly/indirectly affected tables, writes `sdd/<name>/design.md` (design decisions), and generates `sdd/<name>/tasks.md` inline. Re-runnable: add findings to `design.md` after running with real data, then re-run to update design and regenerate pending tasks.
  - **`/modscape:sdd:implement <name>` (updated)** — Accepts `<name>` argument; completion message now guides to `/modscape:sdd:archive`.
  - **`/modscape:sdd:requirements` (updated)** — Proposes a kebab-case folder name from pipeline title; warns on name collision.
  - **`specs/<table-id>.md` format** — Defined permanent business spec format (Overview, Business Context, Business Rules, Known Issues, Changelog) documented in `rules.md`.
  - **`modscape init --sdd`** — Now installs `archive.md` skill and creates `.modscape/specs/.gitkeep` placeholder.

- **SDD model isolation** — The design skill no longer modifies the master model.yaml (e.g., HR.yaml) directly during work. Instead, it extracts relevant tables into `sdd/<name>/model.yaml` (work-scoped YAML) and merges back into the master only at archive time.
  - `/modscape:sdd:design <name>`: runs `modscape extract` to create `sdd/<name>/model.yaml`, all mutation CLI commands target this work YAML
  - `/modscape:sdd:implement <name>`: reads `sdd/<name>/model.yaml` for code generation
  - `/modscape:sdd:archive <name>`: runs `modscape merge sdd/<name>/model.yaml <master>.yaml` (spec-first, so spec version wins) before syncing `specs/*.md`
- **`modscape merge` duplicate warning**: when a table ID already exists in a merged file, a `⚠` warning is now printed instead of silently skipping. The first-encountered version is still used.

- **SDD skill rename: `sdd` → `spec`** — All SDD slash commands renamed from `/modscape:sdd:*` to `/modscape:spec:*`. Work folder path changed from `.modscape/sdd/<name>/` to `.modscape/changes/<name>/`. Custom rules file renamed from `sdd.custom.md` to `modscape-spec.custom.md`.
- **`modscape spec new <name>`** — New CLI command that scaffolds a spec work folder under `.modscape/changes/<name>/` with `spec-config.yaml`, `model.yaml` (`tables: []`), `design.md`, and `tasks.md`. Called automatically by `/modscape:spec:requirements`.
- **`spec-config.yaml`** — New per-spec config file recording which tables belong to which master YAML. Supports multiple master YAMLs (e.g. separate domain YAMLs in a dbt project). Used by design during extract and by archive to route each table to the correct merge target.
- **`modscape extract --append`** — New flag to upsert extracted tables into an existing output YAML instead of overwriting.
- **`modscape extract --record <path>`** — New flag to automatically record the source YAML → table mapping into `spec-config.yaml`. Upserts entries per source file.
- **`/modscape:spec:status <name>`** — New skill showing current phase, file checklist, task progress by phase, unresolved model changes, and the next recommended command.
- **`modscape merge` and `modscape extract` full-section support** — Both commands now correctly carry all YAML root sections: `lineage`, `annotations`, `layout`, `version` (previously dropped on merge/extract). `relationships` now deduplicates by ID in both commands.
- **SDD design findings structure** — `design.md` `## Findings` now has `### Requires Model Change` (triggers model update on re-run) and `### Implementation Notes` (reference only).
- **SDD next-step prompts** — All skills always output a formatted next-step block at completion, and after each task during implement.

### Changed
- **SDD work folder**: `.modscape/sdd/` → `.modscape/changes/`; archive cleanup moves to `.modscape/archives/YYYY-MM-DD-<name>/` instead of leaving in place.
- **`modscape:spec:design` validate step**: replaced `modscape layout` (removed from skill) with `modscape validate` after every model.yaml mutation.
- **`sdd-tasks` skill merged into `sdd-design`** — Tasks are now generated automatically at the end of the design step. The standalone `tasks.md` skill is kept for backward compatibility but is deprecated.

## [2.6.1] - 2026-04-05

### Fixed
- **Dev mode: canvas not visible on initial load** — When starting without a `?model=` URL parameter, the canvas was blank because `fitView` only fired on `currentModelSlug` changes. Fixed by also triggering `fitView` when the canvas registers its fit function and a schema is already loaded.

### Added
- **Terminal Bar: `/clear` command** — Clears the command history. Also accessible via the trash icon button in the console header.

### Changed
- **Terminal Bar: glassmorphism background** — Panel background is now semi-transparent with `backdrop-filter: blur(12px)`, keeping the canvas visible through the console.
- **Terminal Bar: Modscape icon in header** — The Modscape logo now appears in the console header.
- **Terminal Bar: history display** — Command input and output are split into separate lines. Multi-line output (e.g. `/get`) is rendered correctly. Thin dividers separate entries for easier scanning.
- **Terminal Bar: prompt symbols** — Input line uses `$` as the prompt. History entries show `✓` (success) or `✗` (error) instead of `▶` for both states.
- **Terminal Bar: usage hint** — After typing a command name and a space, a usage hint for that command appears above the input line.

## [2.6.0] - 2026-04-03

### Added
- **Terminal Bar** — Replaced CommandPalette with a floating, draggable, and resizable console panel. Open with `Ctrl+K`, close with `Esc` or `✕`. Stays on screen so the canvas remains fully visible while entering commands.
- **Slash commands** — Type `/` inside the Terminal Bar to see a command picker. Supported commands: `/t`, `/d`, `/c`, `/s`, `/er`, `/ln`, `/mv`, `/del`, `/get`, `/rename`, `/label`, `/col`, `/find`, `/fit`, `/pos`, `/theme`.
- **`/pos <id> <x> <y>`** — Move any table or domain node to an absolute canvas coordinate.
- **`/get <id>`** — Show details of any object (table, domain, ER edge, lineage) in the terminal, including columns, relationships, and lineage.
- **`/rename <id> <newId>`** — Rename a table ID with full reference tracking (relationships, lineage, layout, domains.members).
- **`/label <id> <name>`** — Update the display name of a table or domain.
- **`/col add <tableId> <colId>`** — Add a column to a table (duplicate check included).
- **`/col rm <tableId> <colId>`** — Remove a column from a table (existence check included).
- **`/er` relationship type shorthand** — Optional third argument: `1n` (one-to-many), `n1` (many-to-one), `nn` (many-to-many), `11` (one-to-one). Defaults to `1n` if omitted.
- **Command history** — `↑`/`↓` keys cycle through previously executed commands (session only, up to 50 entries).
- **Tab completion** — `Tab` confirms the highlighted suggestion; `↑`/`↓` navigates the list with auto-scroll to keep the active item visible.
- **Canvas highlight** — While typing `/er`, `/ln`, `/mv`, `/del`, or `/find`, matching nodes are highlighted on the canvas in real time.

### Changed
- **CommandPalette removed** — The full-screen modal command palette (`/` key shortcut) is replaced by the Terminal Bar (`Ctrl+K`).
- **`r`/`l` canvas shortcuts removed** — ER and Lineage connect-mode toggles (`R`, `L`) are replaced by `/er` and `/ln` commands in the Terminal Bar. Other canvas shortcuts (`T`, `D`, `C`, `S`, `P`, Arrow keys, `F`, `\`) remain unchanged.
- **`/del` edge ID support** — `/del <id>` now accepts `relationships[].id` and `lineage[].id` directly. No need to specify type separately.
- **Tab completion expanded** — Edge IDs added as candidates for `/del` and `/get`; domain IDs added for `/find`; column IDs of the target table added for `/col rm`.

## [2.5.2] - 2026-04-03

### Fixed
- **Consumer not accepted as domain member via CLI/MCP** — `domain member add` and the `add_domain_member` MCP tool rejected consumer IDs with "Table not found" because the validation only checked `tables`, not `consumers`. Fixed by also looking up `consumers` when validating the member ID. The model validator (`modscape validate`) had the same issue and now accepts consumer IDs in `domains.members` as well.
- **Consumer layout entries flagged as orphaned by `modscape validate`** — The layout validator did not include consumer IDs in its valid ID set, causing any consumer with a `layout` entry to produce a spurious "orphaned layout entry" warning. Fixed by adding `consumerIds` to the valid layout ID set.

### Changed
- **`domain member add/remove --table` renamed to `--id`** — The flag name `--table` was misleading since consumers are also valid domain members. Renamed to `--id` to reflect that any member ID (table or consumer) can be passed. The MCP tool parameter `table_id` is likewise renamed to `member_id`.

## [2.5.1] - 2026-04-03

### Fixed
- **Keyboard shortcuts for edge drawing and consumer** — Added `L` to toggle Lineage Edge mode (previously `C`), `R` to toggle ER Edge mode (previously no shortcut), and reassigned `C` to Add Consumer (previously `U`). Tooltips and Shortcut Guide updated accordingly.
- **Consumer color change not reflected on canvas** — Updating a consumer's color in the Detail Panel was not applied to the canvas node. The schema sync fast-path excluded `consumers` from its change detection, causing Cytoscape element data to stay stale. Fixed by adding `consumers` to the structural change check.
- **Consumer tag unreadable with light colors in light mode** — The CONSUMER tag used the accent color directly as text color, making it invisible against a light background. In light mode the tag now uses a solid color fill with auto-selected contrast text (dark or white based on perceived luminance).
- **ActivityBar tooltip hidden behind Detail Panel** — Hover tooltips on ActivityBar icons (Add Table, Draw Lineage, etc.) were rendered behind the Detail Panel. Fixed by raising the Sidebar stacking context from `z-50` to `z-60`, above the Detail Panel.
- **Lineage edge click unresponsive in Detail Panel** — Clicking a lineage edge added via AI agent or CLI had no effect in the Detail Panel. The root cause was that `getSelectedRelationship` routed edge lookups solely by `id.startsWith('lin-')`, so any lineage ID that did not carry the `lin-` prefix (e.g. `lin_foo` with an underscore, or a custom ID) was silently skipped. Fixed by storing the edge `kind` (`'lineage'` | `'er'`) at selection time (`selectedEdgeKind`) and using it to route directly to the correct array, eliminating all prefix-based assumptions. The same kind-based routing is now applied to edge deletion (Delete key).

## [2.5.0] - 2026-04-02

### Added
- **`modscape consumer list/get/add/update/remove`** — CLI and MCP tools for managing the `consumers` section (BI dashboards, ML models, applications). Supports `name`, `description`, `icon`, `color`, `url` fields.
- **`modscape column list`** — New CLI subcommand to list all columns of a table (MCP `list_columns` already existed; CLI was missing).
- **`modscape annotation list/add/update/remove`** — CLI and MCP tools for managing the `annotations` section (sticky notes / callouts) in model.yaml. AI agents can now write design review notes directly into the model, which appear on the visualizer canvas.
- **`modscape summary`** — New CLI command and `summarize_model` MCP tool that returns a statistical overview of the model in one call: table count, counts by type, domain list with member counts, orphan table IDs, relationship/lineage/annotation counts.
- **`modscape table list --type / --domain / --orphan`** — Filter flags for the table list command and the `list_tables` MCP tool. Filter by appearance type, domain membership, or orphan status (not assigned to any domain).
- **MCP server** (`modscape mcp`) — stdio transport MCP server for Claude Code integration. AI agents can operate on model.yaml via 24 structured tools (list/get/add/update/remove for tables, columns, relationships, lineage, domains) instead of constructing CLI commands.
- **`modscape validate`** — Validates a model.yaml file for structural errors: duplicate IDs, coordinate misplacement (coords inside tables/domains), broken references in relationships/lineage/domains.members/layout, and orphaned layout entries. Supports `--json` for machine-readable output.
- **Shared operations layer** (`src/operations/`) — CLI and MCP now share the same pure functions for all model mutations. No logic duplication.
- **`modscape init --claude` MCP hint** — After scaffolding Claude Code files, the init command now prints the `claude mcp add` command for easy MCP setup.

### Changed
- **CLI internals refactored** — All CLI command definitions moved to `src/cli.js`; per-resource files (`table.js`, `column.js`, etc.) replaced by `src/operations/*.js`. External CLI interface is unchanged.
- **Model format versioning** — `model.yaml` now supports a root-level `version` field (e.g. `"1.0.0"`) to track the format specification version. Optional; parser is backward-compatible. Version is defined in `src/model-format-version.js` as the single source of truth. See `MODEL_FORMAT_CHANGELOG.md`.
- **`relationships[].id` field** — Stable identifier for each relationship entry. Parser auto-generates as `rel-{from}.{cols}-{to}.{cols}` or `rel-{from}-{to}-{type}` if omitted. Enables `annotations.targetType: 'relationship'` and id-based CLI dedup.
- **`lineage[].id` field** — Stable identifier for each lineage entry. Parser auto-generates as `lin-{from}-{to}` if omitted. Enables `annotations.targetType: 'lineage'` and id-based CLI dedup.
- **`implementation.cluster_by`** — New `string[]` field for clustering key hints in code generation.
- **`annotations.targetType: 'lineage'`** — Lineage edges can now be annotation targets.
- **Composite key support** — `relationships[].from.column` / `to.column` now accepts `string | string[]`; parser normalizes to `string[]`.
- **`relationship add --id`** — Optional `--id` flag for stable identity; auto-generated if omitted.
- **`lineage add --id`** — Optional `--id` flag for stable identity; auto-generated if omitted.
- **`MODEL_FORMAT_CHANGELOG.md`** — New file tracking model format changes independently from app releases.
- **`relationships[].description`** — Optional description field on relationship entries, symmetric with `lineage[].description`. Editable in the Detail Panel.
- **`relationship get`** — New CLI subcommand to retrieve a single relationship by `--id` or `--from`/`--to`.
- **`relationship update`** — New CLI subcommand to update `type` or `description` of a relationship by `--id` or `--from`/`--to`.
- **`relationship add --description`** — Optional `--description` flag when adding a relationship.
- **`lineage get`** — New CLI subcommand to retrieve a single lineage entry by `--id` or `--from`/`--to`.
- **Edge ID display in Detail Panel** — Selecting a relationship or lineage edge now shows its stable ID in the panel header with a copy button.

### Changed
- **CLI dedup logic** — `relationship add` and `lineage add` now dedup by `id` instead of table-pair, allowing multiple relationships between the same tables (e.g. role-playing dimensions, composite keys).
- **Cytoscape edge IDs** — ER and lineage edge IDs now use the parser-normalized `rel.id` / `edge.id` values instead of fragile index-based IDs (`er-${i}`, `lin-...-${i}`). PathFinder highlighting and edge deletion now use stable IDs.

### Fixed
- **`relationships[].type: 'lineage'`** — Parser now warns and discards entries with this invalid type value.
- **`sampleData` header row detection** — Parser detects and removes a header row if the first row matches the table's column ID list exactly, and emits a warning.
- **`rules.md` Section 4** — Removed incorrect rule that prohibited `fact` tables as lineage sources.
- **`rules.md` Section 14** — Added missing section (schema version documentation).

## [2.4.1] - 2026-03-30

### Fixed
- **YAML diff viewer context lines** — The diff viewer now shows 3 lines of context around each changed line, with `···` separators between non-adjacent hunks and line numbers on each row. Previously only the changed lines were shown with no surrounding context, making it difficult to identify where changes occurred.

## [2.4.0] - 2026-03-29

### Added
- **Draw Mode** — Freehand drawing overlay for communicating over data model diagrams. Press `P` or click the pencil icon in the ActivityBar to enter draw mode. Features pen / eraser tools, color picker, line width input, and clear-all. Drawings persist when toggling between draw mode and normal mode (Cytoscape interactions remain fully functional). The eraser brush is 4× the pen line width with a circle cursor for size feedback. Drawings are included in image exports (PNG/JPG). Exit with `P` or `Esc`.
- **Fit View shortcut (`F`)** — Press `F` to fit the entire graph in view.
- **Graph-level Undo/Redo (Ctrl+Z / Ctrl+Shift+Z)** — Visual operations on the canvas (add/delete table, domain, relationship, lineage, annotation; drag move; layout apply; domain assignment) can now be undone and redone with keyboard shortcuts. History is scoped per file (resets on file switch) and capped at 50 steps. Text field edits are handled by the browser natively.
- **UI Navigation Redesign**:
  - Moved View/Auto-layout toggles to a floating canvas toolbar for better workspace accessibility.
  - Simplified Sidebar to a 2-tab layout: "YAML" for schema viewing and "Stats" for model statistics.
  - Unified Search Tab in the Right Panel, combining hierarchical domain tree and full-text search.
  - Integrated Relationship Creation (Connect mode) into the Command Palette (Ctrl+K), deprecating the dedicated Connect tab.
  - Updated Command Palette with dedicated modes for Pipeline, Connect ER, and Connect Flow with improved candidate grouping.

### Changed
- **YAML tab is now read-only** — The in-app YAML editor has been replaced with a read-only viewer. YAML editing is intended to be done in an external editor (VS Code, etc.) or via AI agents. The sidebar tab label has been renamed from "Editor" to "YAML".

### Added (patch)
- **Table/Column ID rename** — Table and column IDs can now be renamed directly from the DetailPanel. All references (layout, domains, relationships, lineage, annotations) are updated atomically. Duplicate ID detection shows an inline error.
- **Appearance icon & color editing** — `appearance.icon` (emoji) and `appearance.color` (color picker) are now editable from the DetailPanel header. The color picker defaults to the type's built-in color when no custom color is set.
- **isForeignKey / isPartitionKey toggles** — Added toggle buttons (🔩 / 📂) for `isForeignKey` and `isPartitionKey` in the Logical tab column rows.

### Fixed (patch)
- **DetailPanel auto-close** — The detail panel no longer closes when an external file change is received via WebSocket. Selection is preserved if the selected table still exists in the refreshed schema.
- **Spurious save on model refresh** — Receiving an external file update no longer triggers a redundant write-back to disk.
- **Removed unused schema fields** — `conceptual.businessDefinitions` and `columns[].logical.isMetadata` have been removed from the schema, templates, and documentation.
- **YAML diff viewer** — Added a "Diff" toggle button to the YAML sidebar tab. When enabled, shows a unified diff (added lines in green `+`, removed lines in red `-`) between the last disk-loaded state and the current in-memory model. No diff computation occurs when the toggle is off.

---

## [2.3.1] - 2026-03-29

### Fixed
- **Edges disappeared after relationship deletion** — When a relationship was deleted, edges whose source or target node ID shifted were not re-rendered. Fixed by explicitly re-adding affected edges in `CytoscapeCanvas` after deletion.

---

## [2.3.0] - 2026-03-27

### Added
- **Model Stats tab in right panel** — A new statistics dashboard tab (BarChart2 icon) provides an at-a-glance overview of the data model. Includes: total counts for tables, lineage edges, relationships, and domains; a Lineage Hotspots ranking showing tables by total connection count (upstream + downstream) with a CSS bar chart; and an Isolated Tables section that highlights tables with no lineage connections. Clicking any entry focuses the corresponding node on the canvas.

### Improved
- **Auto-layout: isolated nodes now grouped below connected nodes** — Tables with no lineage or relationship edges are placed in a grid below the main connected graph instead of flying off to distant coordinates. Applies to both `modscape layout` CLI and the UI auto-layout button.
- **Auto-layout: domain grid spacing increased** — Gap between tables inside domains increased (40px → 80px) and default table height assumption raised (160px → 240px) to prevent overlapping for tables with many columns.

### Fixed
- **Auto-layout button did not save YAML** — Pressing the auto-layout button updated the canvas but did not write changes to the YAML file. Root cause: `applyLayout` was not setting `lastUpdateSource` to `'visual'` before calling `saveSchema`.
- **Consumer nodes disappeared from layout section after auto-layout** — Consumer node positions were not collected from dagre and were therefore dropped from `newLayout`, removing their layout entries on every auto-layout run.
- **Deleting a consumer node did not update YAML** — `removeNode` was not setting `lastUpdateSource` to `'visual'`, causing `saveSchema` to skip the file write.
- **Visual operations after YAML editor interaction were not saved** — Any visual mutation (add/remove/update) performed after editing the in-app YAML editor was silently not saved to disk because `lastUpdateSource` remained `'user'`. Fixed by calling `saveSchema` inside `syncToYamlInput` after resetting `lastUpdateSource` to `'visual'`, ensuring all visual mutations eventually persist.

---

## [2.2.3] - 2026-03-27

### Changed
- **PathFinder node selector is now a combobox** — The node selector in the PathFinder tab (both Single Node and Path A→B modes) has been replaced with a free-text combobox. Type to filter nodes by name or ID (case-insensitive substring match); results are still grouped by domain. Click a candidate to select, or use the ✕ button to clear.

### Performance
- **`syncToYamlInput` debounced (300ms)** — Dragging a table on the canvas no longer triggers a full `yaml.dump` on every animation frame. The YAML editor now updates at most once per 300ms burst, reducing CPU usage during drag operations.

### Fixed
- **`modscape export` crashed on models with domains** — `export.js` was reading `domain.tables` instead of `domain.members`, causing a `Cannot read properties of undefined (reading 'forEach')` error whenever a domain existed.
- **`modscape dbt import` generated invalid YAML** — Imported domains were written with `tables:` instead of `members:`, producing YAML that violated the schema and caused domain members to be invisible in the visualizer.

---

## [2.2.2] - 2026-03-27

### Fixed
- **CLI `domain add` wrote `tables` instead of `members`** — `domain add` was initializing the member list as `tables: []` and `domain member add/remove` was reading/writing `domain.tables` instead of `domain.members`. All domain mutation commands now use the correct `members` field.

---

## [2.2.1] - 2026-03-26

### Changed
- **Single-file build** — `modscape build` now outputs a single self-contained `index.html` with all JavaScript, CSS, and assets fully inlined. The output works in environments without a web server (e.g. Google Apps Script, local file open).

---

## [2.2.0] - 2026-03-26

### Added
- **Information Search** — New tab at the top of the Right Panel activity bar. Search across all tables and columns by conceptual name, logical name, physical name, description, and BEAM tags. Results are displayed per-column with a three-tier table name hierarchy (conceptual → logical → physical). Clicking a result focuses the corresponding table on the canvas.
- **Export as Image** — New Download button in the Right Panel activity bar. Export the full canvas (nodes, edges, domains) as PNG or JPG. PNG supports a Transparent background toggle; JPG uses the current theme background color.
- **Lineage description** — Lineage edges now support an optional `description` field for documenting transformations and filter conditions. Edges with a description show a `ⓘ` indicator on the canvas; clicking the edge opens the Detail Panel where the description can be viewed and edited. CLI: `modscape lineage add --description` and new `modscape lineage update` command.

### Fixed
- **Sticky note text color** — Note text color is now derived from the note's background color (luminance-based) rather than the app theme. Light backgrounds get dark text; dark backgrounds get light text, regardless of dark/light mode.

### Removed
- **Presentation Mode** — Removed the Play button and `PresentationOverlay` component. The feature became non-functional after the Cytoscape.js migration and is superseded by Export as Image.

---

## [2.1.1] - 2026-03-26

### Added
- **Cross-file YAML imports** — New top-level `imports:` section lets a model reference table definitions from another YAML file without copying them. Ideal for conformed dimensions shared across multiple models.
- **Imported node read-only indicator** — Imported tables appear on the canvas as normal nodes but show an "Imported — read only" badge in the Detail Panel; edits are blocked to prevent accidental write-back.
- **Import hot-reload** — `modscape dev` watches import source files and reloads the canvas automatically when they change.

### Fixed
- ER edge highlight color in PathFinder now matches the node-click highlight color (`#84cc16`) for visual consistency.
- Saving a model with imported tables no longer writes imported table definitions into the main YAML file.

### Changed
- Rebuilt sample files: `retail-analytics.yaml` shows a full pipeline from Raw Vault → Star Schema → Data Mart → Consumers; `conformed-dims.yaml` serves as a shared conformed dimension source.

---

## [2.1.0] - 2026-03-25

### Added
- **Consumer nodes** — New top-level `consumers` YAML section for modeling downstream data consumers (dashboards, BI tools, data marts). Consumers appear as distinct node type on the canvas.
- **PathFinder: Single Node mode** — Select a node and highlight its 1-hop neighbors or all transitively reachable nodes/edges without specifying a destination.
- **PathFinder: Edge type filter** — Filter graph traversal by ER, Lineage, or Both across all PathFinder modes.
- **Canvas dimming** — Non-highlighted nodes and edges fade to 15% opacity when PathFinder is active, making the result set visually clear.
- **PathFinder node selector** — Node dropdown now groups entries by domain using `<optgroup>` and shows the node ID alongside its name.

### Fixed
- Lineage "All Transitive" traversal now uses directed BFS (separate downstream/upstream passes), preventing unrelated nodes from being highlighted in topologies like A→B←C.
- ER edge highlight color now matches node-click highlight color (`#84cc16`) consistently across PathFinder and node selection.
- PathFinder highlight clears on Esc key.

---

## [2.0.4] - 2025

### Fixed
- Domain background now shrinks correctly when child tables are in compact mode.
- Domain resize handle position corrected in `renderDomainHandles`.

---

## [2.0.3] - 2025

### Added
- **`modscape extract`** command — Extract specific tables by ID from a YAML model into a new file.
- **Model mutation API** — Atomic CLI subcommands (`table`, `column`, `relationship`, `lineage`, `domain`) for AI-friendly YAML editing. All support `--json` output.

### Fixed
- Column visibility toggle button state now stays in sync with edge visibility toggle behavior.

---

## [2.0.2] - 2025

### Added
- **Persistent view settings** — ER/Lineage/Annotations toggle states are saved and restored across sessions.
- **Custom AI rules extension** — Project-level rules file for AI agent guidance.
- **Node selection dimming** — Clicking a node dims all unconnected nodes and edges to improve focus.

---

## [2.0.1] - 2025

### Added
- **`modscape layout`** command — Auto-calculate and write layout coordinates into a YAML model.

### Changed
- Removed legacy lineage rendering logic in favor of Cytoscape-native edges.

---

## [1.0.0] - 2025

Major rewrite of the canvas renderer.

### Changed
- **Migrated canvas to Cytoscape.js** — Replaced custom SVG/DOM renderer with Cytoscape.js for improved performance and layout flexibility.
- Lineage YAML format updated to a flat `lineage` array (`from`/`to` pairs).

### Added
- **Minimap** — Overview minimap panel for large diagrams.
- **Auto layout** — Automatic node placement via layout algorithm.
- **Compact mode** — Collapse table cards to show only the header row.
- **Multi-selection** — Select and move multiple nodes at once.
- **Edge type styling** — ER and Lineage edges rendered with distinct visual styles (solid vs dashed, color-coded).
