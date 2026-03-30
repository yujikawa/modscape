# Changelog

All notable changes to this project will be documented in this file.

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

## [2.0.0] - 2025

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
