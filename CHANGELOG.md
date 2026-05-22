# Changelog

All notable changes to this project will be documented in this file.

## [3.6.0] - 2026-05-22

### Added

- **Metric nodes** — A new `metrics:` top-level section in `model.yaml` lets you define business KPIs and calculated measures alongside your data model. Each metric has an `id`, `name`, optional `expression` (free-form formula displayed on the node card with truncation), and optional `description`. Metrics appear on the canvas as distinct emerald-green nodes (📐 icon) with an expression preview.

- **Lineage to metrics** — The existing `lineage:` section now accepts a metric ID as the `to` value, enabling data flow arrows from source tables to metric nodes. The CLI validator, `findNodeById`, and `rules.md` have all been updated to recognize metric IDs as valid lineage targets.

- **Metric detail panel with inline editing** — Clicking a metric node opens the detail panel with editable Name, Description, and Expression fields (textarea for expression, monospace font). Changes are persisted to YAML in real-time. A delete button removes the metric and its associated lineage entries in one step.

- **`modscape metric` CLI commands** — New `src/operations/metrics.js` provides full CRUD for metrics. Registered as `modscape metric list | get | add | update | remove`. The `add` command accepts `--id`, `--name`, `--expression`, and `--description`.

- **Metrics in SelectionToolbar, SearchTab, and PathFinderTab** — Selecting a metric node shows it in the top-right SelectionToolbar (ChartLine icon). The right panel Search tab includes metrics in both the domain tree and full-text results. PathFinder accepts metrics as source/target nodes.

- **Add Metric button and keyboard shortcut** — The left ActivityBar has a new Add Metric button (ChartLine + Plus icon). Pressing `M` on the canvas adds a metric at the viewport center. The shortcut guide is updated accordingly.

- **AI skill templates updated** — `src/templates/claude/modeling.md`, `gemini/modscape-modeling/SKILL.md`, and `codex/modscape-modeling/SKILL.md` now include a "Metrics & Lineage" section explaining how to define metrics and auto-generate lineage entries from expression analysis.

- **`rules.md` updated** — The quick reference, root structure, Section 5c (Metrics), CLI operations table, and flag reference all document the new `metrics:` key and `modscape metric` commands.

## [3.5.1] - 2026-05-21

### Added

- **`archive` skill — `## Usage Guide` section added to permanent table specs** — Each per-table spec (`<SPEC_DIR>/<model-slug>/<table-id>.md`) now includes a `## Usage Guide` section with four subsections: `⚠ Don't Do This` (patterns that produce incorrect results such as double-counting or wrong JOINs), `Required Filters` (filters that must be applied in every query), `Common JOIN Patterns` (correct join patterns with any SCD or fan-out notes), and `Example Queries` (concrete SQL for common use cases). Population guidance added for each subsection. Applied to all three AI platforms (Claude / Gemini / Codex).

- **`note` skill — `## Usage Guide` added to section routing** — Free-form input describing dangerous patterns, required filters, JOIN patterns, or query examples is now routed to `## Usage Guide` instead of falling through to `## Known Issues / Caveats`. Applied to all three AI platforms (Claude / Gemini / Codex).

- **`note` skill — find-based spec file lookup** — The skill no longer requires knowledge of the exact file path. It locates the spec by running `find <SPEC_DIR> -name "<table-id>.md"` instead of assuming a fixed path structure. When multiple files match (e.g. same table ID in different model slugs), the skill lists the candidates and asks the user to choose. Applied to all three AI platforms (Claude / Gemini / Codex).

### Changed

- **`/modscape:spec:implement` skill — spec fix flow unified to inline single-pass** — When the user requests a spec correction during an implementation session, the previous two-path branch ("minor fix / design change") has been removed. Regardless of the type of change, the skill now updates `design.md` → `spec-model.yaml` → `tasks.md` inline in one pass. Even for structural design changes (table additions, deletions, lineage changes), the flow no longer stops to redirect to `/modscape:spec:design`; after the updates are complete, it simply asks "Continue implementing? (yes / no)". `tasks.md` is updated surgically — only affected tasks are touched (new tasks inserted at the phase determined from lineage, deleted table tasks removed, lineage-changed tasks reset to `[ ]`). Applied to all three AI platforms (Claude / Gemini / Codex).

- **README (EN / JA) — archive output and file structure updated** — The archive section now reflects the current `<model-slug>/<table-id>.md` path convention (replacing the outdated `<table-id>/spec.md` folder-per-table format). `_questions.yaml`, `_glossary.yaml`, and `_context.yaml` are listed explicitly in the file structure diagram and command output column. The `_context.yaml` description is corrected to state that it stores cross-project architectural decisions only (not per-table `last_change` / `open_questions` / `has_spec` metadata). The `generate` and `note` command descriptions are updated to remove hardcoded path references.

## [3.5.0] - 2026-05-21

### Added

- **`/modscape:spec:investigate` skill** — New skill for user-initiated static investigation. The user describes a topic (e.g. "compare logic between table A and table B"), and the AI reads relevant repo files (SQL, dbt models, spec.md, spec-model.yaml, design.md, model.yaml) and records findings in `design.md → ## Findings`. Added for all three AI platforms (Claude / Gemini / Codex). If the investigation reveals a logic error, the skill guides the user to the inline fix flow in `/modscape:spec:implement`; if a model structure change is needed, it points to `/modscape:spec:design`; if an AC contradiction is found, it points to updating spec.md directly.

### Fixed

- **`modscape spec dev` — layout changes now saved to `spec-model.yaml`** — The spec dev server was missing a `POST /api/save` endpoint, so node layout adjustments made in the UI were silently lost on every restart. The endpoint has been added; layout changes are now persisted to `.modscape/changes/<name>/spec-model.yaml` in the same way as the normal `modscape dev` server.

### Changed

- **`check` skill — SSOT-driven consistency checker** — Redesigned from a fixed pairwise comparison to an explicit single-source-of-truth (SSOT) mode. Usage: `/modscape:spec:check <name> [--from spec-model.yaml|design.md|spec.md]`. Default SSOT is `spec-model.yaml` (machine-readable truth); other artifacts are validated against it. Each issue includes a `→ Fix:` pointer to the correct artifact to update. Verdict levels: ✅ Ready / ⚠️ Caution / 🚫 Blocker. Updated for all three AI platforms (Claude / Gemini / Codex).

- **`status` skill — next-action for model-change findings updated** — The "Requires Model Change" finding in `design.md` now points to `/modscape:spec:implement <name>` (inline fix protocol) instead of the removed `amend` skill. Added an "Anytime" note at the bottom of the next-command table advertising `/modscape:spec:investigate <name>`. Updated for all three AI platforms.

- **`answer` skill — spec impact guidance updated** — When a question reveals an AC contradiction, the skill now instructs the user to update the affected AC in `spec.md` directly and continue with `/modscape:spec:implement`, instead of pointing to the removed `amend` skill. Updated for all three AI platforms.

- **`help` skill — command list updated** — Removed `amend`, `save`, and `load` from the Workflow Support Commands table. Added `investigate` row. Updated `check` description to include the `--from` syntax. Updated for all three AI platforms.

### Removed

- **`/modscape:spec:amend` skill** — Removed. Post-implementation spec fixes are now handled inline by `/modscape:spec:implement` (inline fix protocol) or by directly editing `spec.md`. Template files and `SPEC_SKILL_NAMES` updated accordingly.

- **`/modscape:spec:save` skill** — Removed. Session state persistence via `session.md` proved fragile and added complexity without clear benefit. Removed for all three AI platforms.

- **`/modscape:spec:load` skill** — Removed alongside `save`. Both skills are no longer installed by `modscape init` or `modscape update`. `SPEC_SKILL_NAMES` updated to reflect the removals.

## [3.4.3] - 2026-05-15

### Added

- **SDD format templates** — Three new files (`spec-format.md`, `design-format.md`, `glossary-format.md`) are now installed to `.modscape/formats/` when SDD skills are set up via `modscape init` or `modscape update`. These files define the canonical Markdown format for each artifact. SDD skill instructions (across Claude Code, Gemini, and Codex) now reference these files instead of embedding the format inline, so updating the format no longer requires editing multiple skill files — just update the template and run `modscape update`.

  The new formats improve readability in `modscape spec dev`, GitHub, and VSCode Markdown preview:
  - **spec.md**: Stakeholders and Table Relationships are now tables; `---` separators between sections; Status is a blockquote; Acceptance Criteria use bold IDs and em-dashes.
  - **design.md**: Affected Tables is now a unified table (instead of three nested bullet-list subsections); sections separated by `---`; Findings subsections use italic notes instead of angle-bracket placeholders.
  - **glossary.md**: Converted from nested bullet list to a four-column table (Term / Definition / Tables / Columns).

- **`modscape update --yes` / `-y`** — New flag that overwrites format template files without prompting. Without `--yes`, `modscape update` now asks before overwriting any file in `.modscape/formats/` (since these may be project-customized). Skill and rules files continue to be overwritten unconditionally as before.

- **`modscape lint` — cross-file duplicate table ID detection** — `modscape lint` now accepts multiple files and directories (`modscape lint models/` or `modscape lint a.yaml b.yaml`). A new lint rule `no-duplicate-table-ids` warns when the same table ID is defined in more than one YAML file without an explicit `imports:` relationship. The correct pattern is for one file to own the table definition while consumers reference it via `imports:`. Severity defaults to `warn` and can be suppressed via `.modscape/lint-rules.yaml`. The `--json` output includes a `files` array on each warning entry identifying which files contain the duplicate.

- **`modscape extract` — duplicate table ID warning** — When `extract` encounters the same table ID in multiple source files, it now prints a `WARN: <id>  duplicate-table-id` message to stderr showing which file was overwritten. The last-wins merge behavior is unchanged.

## [3.4.2] - 2026-05-15

### Fixed

- **`modscape init` / `modscape update` — `load` skill now installed correctly** — The `/modscape:spec:load` skill added in v3.4.1 was missing from `SPEC_SKILL_NAMES` in `src/template-files.js`, so `init` and `update` did not install it for any AI platform. The skill name has been added to the list and is now scaffolded correctly for Claude Code, Gemini, and Codex.

### Changed

- **AGENTS.md — skill checklist for new SDD skills** — Added an explicit list of current SDD skills and a three-step checklist describing what must be updated when a new skill is added (template files, `SPEC_SKILL_NAMES`, and the skill list in AGENTS.md itself).

## [3.4.1] - 2026-05-14

### Added

- **`/modscape:spec:load` skill** — New skill paired with `/modscape:spec:save`. Reads `.modscape/changes/<name>/session.md`, injects the saved context (decisions, open issues, next action, notes) into the current conversation, then deletes the file so stale state does not accumulate. Added for all three AI platforms (Claude / Gemini / Codex).

### Changed

- **SDD skill — visualizer preview command updated** — The `modscape dev .modscape/changes/<name>/spec-model.yaml` command referenced in the `design` and `implement` skill instructions has been replaced with `modscape spec dev <name>`. Updated for all three AI platforms (Claude / Gemini / Codex).

- **SDD skills — language-agnostic output** — All skill output (labels, confirmation messages, section headers, status blocks) is now in English by default. Output language is configurable per project via the `## Communication` section in `.modscape/modscape-spec.custom.md`. Each skill reads this setting at the start of every session. Updated for all three AI platforms (Claude / Gemini / Codex).

- **`status` skill — `session.md` auto-read removed** — The status output no longer automatically includes the "Previous session" block from `session.md`. Session state is now loaded explicitly via `/modscape:spec:load`. Updated for all three AI platforms (Claude / Gemini / Codex).

- **`save` skill — resume instruction updated** — The post-save confirmation now points to `/modscape:spec:load <name>` instead of `/modscape:spec:status <name>` for resuming a session. Updated for all three AI platforms (Claude / Gemini / Codex).

- **`modscape-spec.custom.md.example` — Communication section clarified** — Default language (English) is now stated explicitly. Users only need to add a directive when overriding to another language.

- **AGENTS.md — SDD language policy documented** — Added a dedicated section describing the language-agnostic design, the default-English rule, and the per-skill language detection pattern.

## [3.4.0] - 2026-05-14

### Added

- **`.modscape/modscape-spec.config.yaml`** — New machine-readable config file for modscape:spec settings. Separates structured tool settings from the AI-facing rules in `modscape-spec.custom.md`. `readSpecConfig()` and `writeSpecConfig()` helpers added to `model-utils.js`.

- **`modscape spec` command namespace** — Three new subcommands for browsing permanent specs stored in `.modscape/specs/`:
  - **`modscape spec dev <name>`** — SDD spec viewer for an in-progress change. Replaces `modscape dev --spec <name>`. Launches the visualizer against `spec-model.yaml` with a tabbed floating panel for spec artifacts (`spec.md`, `design.md`, `tasks.md`, `questions.md`). Supports live reload. Markdown files are rendered as styled HTML server-side using `marked` + `highlight.js` (`atom-one-light` theme).
  - **`modscape spec open`** — Dedicated spec browser for `.modscape/specs/`. Left pane shows model-slug grouped table list; right pane renders `.md` specs in styled HTML. Live-reloads on file changes. Runs on port 5174.
  - **`modscape spec build [outDir]`** — Builds a static spec browser (defaults to `dist/specs/`). Copies all spec files and generates `index.html` with vanilla JS navigation. No server required.

- **SpecPanel floating window** — New draggable and resizable floating panel component in the visualizer, matching the existing DetailPanel UX pattern. Rendered on top of the graph in spec mode; toggled with the file-text icon in the RightPanel activity bar. Tabs switch between spec artifacts.

- **Server-side Markdown rendering in `modscape spec dev`** — Spec artifacts are Markdown files (`.md`). The dev server converts them to styled HTML on-the-fly using `marked` + `marked-highlight` + `highlight.js`, with a light gray color scheme (`#f8f9fa` body, `#1e293b` text) that renders correctly regardless of OS dark mode settings. No HTML template generation required.

### Changed

- **Left sidebar closed by default** — The left sidebar now starts closed on first load. The YAML tab remains the active tab when the sidebar is opened.

- **`modscape spec dev` — Glossary tab** — `glossary.md` in the spec change directory is now displayed as a dedicated "Glossary" tab in the SpecPanel, alongside Spec / Design / Tasks / Questions.

- **`modscape spec dev` — Spec name copy button** — A copy icon button has been added to the SpecPanel title bar. Clicking it copies the spec name to the clipboard, making it easy to paste into `/modscape <spec name>` skill invocations.

- **`modscape spec dev` — Code block copy button** — All code blocks in rendered Markdown spec files now show a "Copy" button on hover (top-right corner). Useful for copying SQL snippets and other code directly from specs.

- **`/api/context/tables` endpoint** — Now accepts a `?model=<slug>` query parameter to scan the `specs/<slug>/` subdirectory for per-table Markdown spec files. Returns `{ spec: string }` per table. Omitting `?model=` falls back to scanning `specs/` directly (backward compatible).

- **`modscape dev --spec` removed** — The `--spec` flag for `modscape dev` has been replaced by the `modscape spec dev <name>` subcommand. The ContextPanel Specs tab continues to display Markdown specs as `<pre>` text.

- **Questions workflow reverted to per-spec `questions.md`** — During active development (`requirements`, `design`, `implement`, `amend`), questions are written to `.modscape/changes/<name>/questions.md` in YAML format. `_questions.yaml` is updated only at archive time, keeping the project-wide file clean from in-progress spec data. `archive` reads `questions.md` as YAML and appends entries to `_questions.yaml` directly (no ID reassignment needed). Updated for all three AI platforms (Claude / Gemini / Codex).

- **`archive` skill — model-slug directory structure** — Permanent per-table specs are now stored at `<SPEC_DIR>/<model-slug>/<table-id>.md` as flat files. The model slug is derived from the main YAML filename via `path.parse().name` (e.g., `models/main-model1.yaml` → `main-model1`). Previously, specs were stored at `<SPEC_DIR>/<table-id>/spec.md`. Old folder-format specs are detected at archive time and flagged for manual migration. Updated for all three AI platforms (Claude / Gemini / Codex).

- **`design` skill — open questions reference corrected** — Step 10 (surface known open questions) previously checked `.modscape/specs/questions.md`, a path that no longer exists. Now correctly reads from `_questions.yaml` filtered by `status: open` or `status: assumed`. Updated for all three AI platforms (Claude / Gemini / Codex).

## [3.3.2] - 2026-05-08

### Added

- **`modscape update` CLI command** — New command that updates all installed skill/rule files to the latest bundled version without re-running the full `init` flow. Auto-detects which agents (Claude / Gemini / Codex) and whether SDD skills are installed based on existing directories, then overwrites template-managed files (`rules.md`, `codegen-rules.md`, and all skill command files) in one step. User data in `.modscape/specs/` is never touched. Replaces the previous workflow of re-running `modscape init` after upgrading.

- **`/modscape:codegen` skill — SDD context integration** — The codegen skill now reads SDD context from `.modscape/specs/` when it exists, before generating any code. Specifically: `_context.yaml` (architecture decisions), `_glossary.yaml` (business term definitions), `_questions.yaml` (Q&A — answered/assumed questions reduce TODO comments; open questions become `-- TODO:` stubs), and `<table-id>/spec.md` for each table being generated (business rules, grain, dependencies). This allows the agent to generate more accurate code and significantly reduce speculative TODO comments for projects using the SDD workflow. Updated for all three AI platforms (Claude / Gemini / Codex).

## [3.3.1] - 2026-05-07

### Added

- **`## Spec Directory` support in `modscape-spec.custom.md`** — The permanent spec storage directory used by `/modscape:spec:archive` is now configurable. Add a `## Spec Directory` section with `Spec directory: <path>` to `.modscape/modscape-spec.custom.md` to override the default `.modscape/specs` location. All archive operations (spec sync, `_questions.yaml`, `_glossary.yaml`, `_context.yaml`) respect the custom path. Updated for all three AI platforms (Claude / Gemini / Codex).

### Changed

- **`modscape-spec.custom.md.example`** — Updated to reflect current SDD workflow: renamed `model.yaml` → `spec-model.yaml`, corrected spec path to `specs/<table-id>/spec.md` (directory format), added `/modscape:spec:tasks` to the workflow description, and added the new `## Spec Directory` section.

## [3.3.0] - 2026-05-03

### Added

- **`modscape lint` CLI command** — New command that checks documentation quality and modeling best-practice compliance of a model YAML file. Rules are configured in `.modscape/lint-rules.yaml` using ESLint-style severity levels (`error` / `warn` / `off`) with per-rule options such as `target` (tables / columns / all) and `kinds` (filter by `conceptual.kind`). Built-in rules: `require-description`, `require-primary-key`, `require-physical-name`, `require-column-type`, `require-tags`, `no-orphan-references`, and `incremental-requires-merge-key`. Runs with a default rule set (all rules at `warn`) when no configuration file is present. Supports `--rules <path>` for a custom rules file and `--json` for CI/CD integration (exits 1 on any error).

- **`modscape prune` CLI command** — New command that detects orphaned entries in a model YAML file. Defaults to dry-run (lists candidates without modifying the file); pass `--write` to actually remove them. Detects: relationships referencing non-existent tables, lineage entries referencing non-existent tables, layout keys for non-existent tables or domains, and `domains[].members` entries for non-existent tables. Pass `--include-isolated` to also surface tables that appear in no relationship or lineage edge. Fully resolves `imports:` before checking, so cross-file references are not falsely flagged. Supports `--json` for machine-readable output.

- **`/modscape:spec:save` skill** — New AI skill (Claude / Gemini / Codex) for saving the current session state before ending a work session. Reviews the conversation and writes `.modscape/changes/<name>/session.md` with four sections: 決定済み事項 (decided items), 未解決事項 (open issues), 次のアクション (next action), and メモ (free-form notes). The saved state is displayed the next time `/modscape:spec:status <name>` is run, providing continuity across interrupted design and requirements sessions.

- **`/modscape:spec:status` skill — session continuity and priority-based next action** — Extended to show the previous session's state when `session.md` exists (decisions, open issues, next action from last session). Also added priority-based next-action logic: the recommended command is now determined by a fixed priority order (model changes pending → unresolved questions → missing spec/design/tasks → incomplete tasks → archive) rather than phase alone. Updated for all three AI platforms (Claude / Gemini / Codex).

- **Save hints in SDD skills** — `requirements`, `design`, `implement`, and `amend` skills now include a `🔖 To pause and resume later, run \`/modscape:spec:save <name>\`.` hint at the end of their output blocks, making the save command discoverable during interactive sessions. Updated for all three AI platforms (Claude / Gemini / Codex).

## [3.2.1] - 2026-04-28

### Changed

- **`/modscape:spec:amend` skill** — Extended to also update `spec-model.yaml` when a finding involves a column-level change (type, constraint, name, description). Findings are now classified as either **軽微な修正**（列レベルの変更）or **設計変更**（テーブル追加・削除・lineage 変更）. Lightweight fixes are applied inline via mutation CLI + `modscape validate`; structural changes prompt for confirmation and guide the user to re-run `/modscape:spec:design`. All runs now output a **波及確認レポート** (ripple-effect report) summarising the state of all three core artifacts (`spec.md` / `design.md` / `spec-model.yaml`) after each change. Updated for all three AI platforms (Claude / Gemini / Codex).

- **`/modscape:spec:design` skill** — Added a consistency check step (step 14.5) that runs after every `spec-model.yaml` change: reads `spec.md` Acceptance Criteria, identifies any contradiction with the updated model, and fixes `spec.md` inline if needed. Also added a **波及確認レポート** to the mandatory Next Step output block, showing the state of all three core artifacts. Updated for all three AI platforms (Claude / Gemini / Codex).

- **`/modscape:spec:implement` skill** — Rewrote the "If You Discover Issues During Implementation" section to support **inline finding handling** without requiring a command switch. When a user reports a problem in plain conversation during an implementation session, the skill classifies it as lightweight or structural, applies lightweight fixes immediately to all three core artifacts (`spec-model.yaml` → `spec.md` → `design.md` Findings), outputs a **波及確認レポート（インライン修正）**, and continues implementation — or records the finding in `design.md` and pauses for `/modscape:spec:design` re-run if the fix requires structural changes. Updated for all three AI platforms (Claude / Gemini / Codex).

- **`modscape layout` CLI command** — Fixed a discrepancy between CLI and UI layout results. `GAP` was corrected from 80 to 40 to match the visualizer. Table height is now estimated from column count (`44 + columns × 36px`) instead of a fixed 240px, and domain grid rows use per-row variable heights — matching the UI's DOM-measured approach. Isolated standalone tables also use the estimated height for their grid anchor.

- **`conceptual.kind` free-form input** — The Kind field in the Detail Panel now accepts any free-form string in addition to the preset options (fact / dimension / mart / table / hub / link / satellite). A datalist dropdown still surfaces the standard choices, but custom values such as `ephemeral`, `seed`, or `snapshot` can be typed in directly. Updated `rules.md` to document this behavior.

## [3.2.0] - 2026-04-28

### Added

- **`modscape coverage` CLI command** — New command that outputs model statistics (table count, relationship count, lineage edge count, isolated tables) and documentation coverage (table description rate, column type rate, overall score) for any model YAML file. Accepts `--min-coverage <N>` to exit 1 when overall coverage falls below the threshold (CI/CD gate), and `--json` for machine-readable output. Works on both main model files and SDD spec-model files.

- **Documentation Coverage section in Model Stats tab** — New section in the right panel's Model Stats tab. Triggered by a manual "Calculate Coverage" button to avoid any impact on graph rendering performance. Displays overall coverage score with color coding (green ≥ 70%, amber ≥ 40%, red < 40%), per-category breakdown (tables/columns), and a list of low-coverage tables sorted by score. Clicking a table row focuses the canvas on that table. Results are reset when the schema changes.

- **Coverage Policy support in SDD skills** — When `.modscape/modscape-spec.custom.md` contains a `## Coverage Policy` section with a minimum threshold (e.g., `Minimum documentation coverage: 70%`), the `/modscape:spec:check` skill now shows a Documentation Coverage section in Part 2: Readiness, and the `/modscape:spec:archive` skill runs a coverage gate before merging — prompting for confirmation if the threshold is not met. Coverage checks are completely skipped when no policy is configured (zero impact on existing projects). Updated for all three AI platforms (Claude / Gemini / Codex).

- **Coverage Policy section in `modscape-spec.custom.md.example`** — The example custom rules template now includes a commented-out `## Coverage Policy` section showing how to enable per-project coverage enforcement.

## [3.1.7] - 2026-04-25

### Added

- **`/modscape:spec:note` skill** — New AI skill (Claude / Gemini / Codex) for capturing free-form knowledge — from conversations, Slack messages, or meetings — and appending it to `specs/<table-id>/spec.md`. Accepts an optional table ID argument; without it, the AI infers the target table(s) from the input text. Always shows a confirmation preview before writing. Maps the content to the appropriate section (`Business Rules`, `Known Issues / Caveats`, `Business Context`, or `Overview`). Runs outside the SDD implementation workflow — no active change required. If the target spec does not exist, exits with a hint to run `/modscape:spec:generate` first.

- **`/modscape:spec:check` skill** — New AI skill (Claude / Gemini / Codex) that combines the former `review` and `validate` commands into a single pre-implementation quality check. Part 1 (Consistency) runs cross-artifact checks across `spec.md`, `design.md`, `tasks.md`, `spec-model.yaml`, and `questions.md` — flagging missing table classifications, untracked model changes, Direct Impact tables with no tasks, and unresolved questions without recorded assumptions. Part 2 (Readiness) evaluates go/no-go criteria: unresolved questions, assumptions, AC coverage, and downstream classification confidence. Outputs a combined report with an overall status: ✅ ready, ⚠️ proceed with caution, or 🚫 blocking issues.

### Changed

- **`/modscape:spec:status` skill** — Added a `detail` subcommand (`/modscape:spec:status <name> detail`). Running with `detail` outputs the standard status dashboard followed by a narrative section covering: Overview (Why/purpose from `spec.md`), What Changes, Key Decisions (from `design.md`), Non-Goals, and Remaining Tasks grouped by phase. Replaces the standalone `explain` skill for handoff and onboarding use cases. Updated for all three AI platforms (Claude / Gemini / Codex).

- **`/modscape:spec:help` skill** — Updated the Workflow Support command table to reflect the merged skill set: replaced `review`, `validate`, and `explain` entries with `check` and `status <name> detail`. Updated for all three AI platforms (Claude / Gemini / Codex).

### Removed

- **`/modscape:spec:review` skill** — Removed. Go/no-go readiness checks (unresolved questions, assumptions, AC coverage, downstream classification confidence) are now part of `/modscape:spec:check` (Part 2: Readiness).

- **`/modscape:spec:validate` skill** — Removed. Cross-artifact consistency checks are now part of `/modscape:spec:check` (Part 1: Consistency).

- **`/modscape:spec:explain` skill** — Removed. Handoff and onboarding output is now available via `/modscape:spec:status <name> detail`.

## [3.1.6] - 2026-04-23

### Added

- **`/modscape:spec:generate` skill** — New AI skill (Claude / Gemini / Codex) for bootstrapping permanent table specs from existing implementation artifacts. Accepts model.yaml, SQL files (DDL / dbt models), and Python files (SQLAlchemy / PySpark / pandas) as input — either as arguments or collected interactively. For each discovered table, generates `.modscape/specs/<table-id>/spec.md` using the physical table name as the ID. Existing spec files are never overwritten. Optionally updates (or creates) `model.yaml` from the same input. Outputs a summary of generated, skipped, and conflicting tables. Use this to establish a spec baseline before starting the regular SDD flow (`/modscape:spec:requirements` → `/modscape:spec:design`).

## [3.1.5] - 2026-04-23

### Removed

- **MCP server** — Removed the `modscape mcp` command and the entire MCP server implementation (`src/mcp.js`). The `@modelcontextprotocol/sdk` and `zod` dependencies have been dropped from `package.json`. All references to MCP tools have been removed from `README.md`, `README.ja.md`, `src/templates/rules.md`, and all SDD skill templates (Claude / Gemini / Codex). The `.gemini/settings.json` MCP server registration has also been cleared.

## [3.1.4] - 2026-04-23

### Added

- **`modscape export --with-context`** — The `export` command now accepts a `--with-context [specs-dir]` flag that merges SDD context (glossary, decisions, Q&A, and per-table specs) into the exported Markdown document. Context is sourced from `.modscape/specs/` by default or a custom directory if specified. Per-table specs are embedded inline within each table's section; glossary, decisions, and Q&A are appended at the end.

### Removed

- **`modscape context export` command** — Removed in favour of `modscape export --with-context`. The standalone `context export` command (which output context-only JSON or Markdown) was redundant: AI agents consume Markdown directly, making the JSON format unnecessary, and the integrated `--with-context` flag covers the combined output use case more cleanly.

## [3.1.3] - 2026-04-23

### Added

- **`/modscape:spec:explain` skill** — New AI skill (Claude / Gemini / Codex) for spec handoff and onboarding. Given a work folder name, it reads `spec.md`, `design.md`, and `tasks.md` and outputs a structured briefing: background and purpose (from the Why section), what changes are being made, key design decisions with chosen approaches, non-goals, and the list of remaining tasks with their full text grouped by phase. Complements `/modscape:spec:status` (which shows file/task counts) by explaining the *content* rather than just the progress.

- **`/modscape:spec:help` skill** — New AI skill (Claude / Gemini / Codex) that displays the SDD workflow overview or answers a specific question. Run with no arguments to see the full workflow diagram, command descriptions, file structure, and common Q&A. Run with a topic or question (e.g. `/modscape:spec:help design`, `/modscape:spec:help requirements vs design`) for a focused answer.
- **`rules.custom.md.example` template** — `modscape init --sdd` now generates `.modscape/rules.custom.md.example` alongside `modscape-spec.custom.md.example`. Rename to `rules.custom.md` to activate. Contains commented-out sections for naming conventions, allowed table types, domain topology, required columns, SCD policy, and tags policy.

### Changed

- **SDD `design` skill — iterative design mode** — `/modscape:spec:design` can now be run repeatedly to iterate on the design. On re-run it shows the current state (table count, table IDs, unresolved questions) and asks what to add or change, rather than automatically regenerating `tasks.md`. When the design is finalized, run `/modscape:spec:tasks <name>` explicitly. Applies to Claude / Gemini / Codex skills.
- **SDD `design` skill — `tasks.md` generation removed** — Task generation has been moved out of `design` and into the dedicated `/modscape:spec:tasks` skill. `design` now only produces `spec-model.yaml` and `design.md`. Applies to Claude / Gemini / Codex skills.
- **`modscape-spec.custom.md` moved to `.modscape/` root** — Previously placed under `.modscape/changes/`, it now lives at `.modscape/modscape-spec.custom.md`, alongside `rules.md` and `rules.custom.md`. All SDD skill templates (Claude / Gemini / Codex) and `init.js` updated accordingly.
- **`modscape-spec.custom.md.example` template moved** — Source template relocated from `src/templates/claude/spec/` to `src/templates/` (alongside `rules.md`), reflecting its shared, agent-agnostic nature.
- **SDD `archive` skill — convention extraction step** — Added Step 5.5 to the archive workflow (Claude / Gemini / Codex). After updating `_context.yaml` and before moving to archives, the skill reviews `design.md` and `spec.md` for any project-wide conventions established during the change and offers to append them to `rules.custom.md` (data model rules) or `modscape-spec.custom.md` (SDD workflow rules). Decision axis: rules that are tool-agnostic go to `rules.custom.md`; rules specific to the implementation tool or workflow go to `modscape-spec.custom.md`. Archive summary now reports conventions recorded.

## [3.1.2] - 2026-04-22

### Fixed

- **`modscape init --sdd` — `validate` skill not copied** — Fixed an issue where the `/modscape:spec:validate` command file was not copied when running `modscape init --sdd`. Added `validate` to the `specSkillNames` list so it is now correctly scaffolded for all agents (Claude Code / Gemini / Codex).

## [3.1.1] - 2026-04-21

### Fixed

- **`/modscape:spec:validate` skill** — New AI skill (Claude / Gemini / Codex) that checks cross-artifact consistency across all SDD documents in a work folder. Reports mismatches, gaps, and drift in four categories: A) spec.md ↔ design.md (table coverage, Requires Model Change tracking), B) design.md ↔ spec-model.yaml (Direct Impact table existence, model table classification), C) design.md ↔ tasks.md (Direct Impact task coverage), D) questions.md ↔ design.md (unresolved Q&A recorded as assumptions). Complements `/modscape:spec:review` (go/no-go) by focusing on structural consistency rather than readiness.

- **SDD: work-scoped `glossary.md`** — `requirements` and `design` skills now record project-specific business terms to `.modscape/changes/<name>/glossary.md` (instead of writing directly to `_glossary.yaml`). The `archive` skill merges `glossary.md` into `_glossary.yaml` at archive time, mirroring the existing `questions.md` pattern. Applies to Claude / Gemini / Codex skills.
- **SDD `design` skill — model inspection rule** — Clarified that model data (tables, columns, lineage, relationships, domains) MUST be read via modscape CLI or MCP tools with no exceptions; spec artifacts (`spec.md`, `design.md`, `_context.yaml`, etc.) should be read directly with file read tools. Writing scripts or code (Python, shell, etc.) to inspect the model is now explicitly prohibited. Applies to Claude / Gemini / Codex skills.
- **SDD `design` skill — lineage vs relationship rule** — Added explicit prohibition: `lineage` MUST NOT be used to represent FK joins between tables. FK joins MUST be expressed as `relationship` entries. Applies to Claude / Gemini / Codex skills.
- **CLI: `modscape lineage list --from --recursive --depth`** — Added downstream impact analysis options to `lineage list`. `--from <tableId>` filters entries originating from a specific table; `--recursive` performs BFS traversal to collect all transitive downstream tables; `--depth <n>` limits traversal depth. Text output shows `(depth: N)` per entry when `--recursive` is active.
- **SDD `design` skill — downstream impact check step** — Added step 6 instructing the design skill to run `modscape lineage list <file> --from <tableId> --recursive --json` before extracting tables when modifying an existing table. Applies to Claude / Gemini / Codex skills.

## [3.1.0] - 2026-04-21

### Added

- **`/modscape:spec:review` skill** — New AI skill (Claude / Gemini / Codex) that reads `questions.md`, `design.md`, `spec.md`, and `tasks.md` to display a go/no-go review summary: unresolved questions, assumptions, AC coverage (test-covered / manual / uncovered), and low-confidence downstream classifications. Also embedded as a Review Checkpoint at the end of `/modscape:spec:design`.
- **`/modscape:spec:requirements` — AC-NNN ID assignment** — Acceptance Criteria are now automatically assigned sequential IDs (`AC-001`, `AC-002`, ...) during requirements collection across Claude / Gemini / Codex.
- **`/modscape:spec:design` — AC ↔ test mapping** — Phase 4 test tasks in `tasks.md` now include `[→ AC-NNN]` annotations linking each test to its corresponding acceptance criteria. ACs that cannot be auto-tested are added as `[手動検証]` lines.
- **`/modscape:spec:archive` — dry-run merge preview** — Before merging the work YAML into the main model, the archive skill now displays an ID-level summary (tables added / updated with changed fields / unchanged) and requires explicit user confirmation before proceeding.
- **`/modscape:spec:archive` — AC coverage in archive summary** — The archive completion summary now includes AC coverage: test-covered, manual verification, and uncovered AC counts.
- **`modscape spec search <keyword>`** — New CLI command to search past archives (`.modscape/archives/`) and permanent specs (`.modscape/specs/`) by keyword. Supports `--json` for machine-readable output and `--limit <n>` to control result count (default: 5).
- **`/modscape:spec:search` skill** — New AI skill (Claude / Gemini / Codex) that runs `modscape spec search --json`, summarizes results, and incorporates selected findings into the current spec or design on explicit user request.
- **`/modscape:spec:design` — Known Open Questions surfacing** — On first run, the design skill now checks `.modscape/specs/questions.md` for unresolved questions related to Direct Impact tables and inserts their Q-NNN IDs into `design.md` under `## Known Open Questions`.
- **`/modscape:spec:design` — Related Past Specs suggestion** — On first run, the design skill now runs `modscape spec search` for each Direct Impact table ID and records matching past archives/specs in `design.md` under `## Related Past Specs`.
- **`/modscape:spec:amend` skill** — New AI skill (Claude / Gemini / Codex) for updating SDD artifacts when issues are discovered during implementation. Accepts free-text input (error messages, wrong assumptions, ambiguities) and updates `spec.md`, `design.md`, `tasks.md`, and/or `questions.md` as needed. Completed tasks (`- [x]`) are always preserved. Fix tasks are appended under `## Amend: <YYYY-MM-DD>` sections. Can be called at any point in the workflow, as many times as needed.
- **`/modscape:spec:answer` skill** — New AI skill (Claude / Gemini / Codex) replacing the `modscape spec answer` CLI command. Displays the specified Q-NNN question, accepts a free-text answer, performs follow-up questioning when the answer is ambiguous or incomplete, records the final clarified answer in `questions.md`, and assesses whether the answer has design or spec impact.
- **SDD context layer** — `.modscape/specs/` now uses a per-table directory structure (`specs/<table-id>/spec.md` + `specs/<table-id>/questions.md`). A cross-table `_context.yaml` file tracks SDD-specific metadata: `last_change`, `open_questions`, `has_spec`, and `decisions`. The `archive` skill writes to this structure automatically and migrates old flat `specs/<id>.md` files on first encounter.
- **Visualizer: SDD context badges** — Table cards now show ❓ (amber) and 📝 (green) badges when `open_questions > 0` or `has_spec: true` respectively, sourced from `_context.yaml`.
- **Visualizer: Decisions tab** — New "Decisions" tab (📖) in the right panel lists all entries from `_context.yaml.decisions`, showing each decision's ID, date, summary, affected tables, and originating change.
- **Visualizer: SDD context in detail panel** — The entity detail panel now shows `last_change` and open questions count for tables that have SDD context data.

- **`modscape context export` CLI command** — Exports all tacit knowledge from `.modscape/specs/` (decisions, Q&A, per-table spec.md and questions.md) as a single JSON or Markdown document. Useful as context input for AI agents or for reading in the knowledge page. Options: `--format json|md`, `[specs-dir]`.
- **Knowledge page (`context.html`)** — New standalone HTML page built alongside `index.html` (graph view) by `modscape build` and served at `/context.html` by `modscape dev`. Displays project-level decisions and Q&A from `_context.yaml`, plus per-table spec.md and questions.md content. Separate from graph view to keep both focused.
- **`_context.yaml` schema redesign** — `tables.*` metadata fields (`last_change`, `has_spec`, `open_questions`) removed. `_context.yaml` now stores only cross-project tacit knowledge: `decisions` (with optional `rationale` field) and `questions` (Q&A pairs with `answer` field). `spec new` auto-creates an empty template if the file does not yet exist.

### Removed

- **`modscape spec answer` CLI command** — Removed in favour of the `/modscape:spec:answer` AI skill, which provides interactive follow-up questioning and design-impact assessment that the CLI could not offer.
- **Visualizer: Decisions tab and SDD context badges** — Removed from graph view (DecisionsTab, Decisions tab in DetailPanel, ❓ badge). These are now available in the dedicated knowledge page (`context.html`).

## [3.0.1] - 2026-04-13

### Fixed

- **`modscape spec new`** — `spec-model.yaml` now includes `version: "<MODEL_FORMAT_VERSION>"` at the root. Previously the file was generated as `tables: []` with no version field, causing `modscape validate` to reject it as a v1 schema.
- **`requirements` skill (Claude)** — Fixed incorrect filename `model.yaml` → `spec-model.yaml` in the scaffold description. Gemini and Codex versions were already correct.
- **`spec-config.yaml` key rename** — `master_yamls` → `main_yamls` throughout all SDD skills (Claude / Gemini / Codex) and CLI implementation (`spec.js`, `extract.js`).
- **SDD skill terminology** — "Master YAML" / "master model" → "Main YAML" / "main model" across all skill templates (Claude / Gemini / Codex): `requirements`, `design`, `implement`, `archive`.
- **`tasks.md` skill** — Fixed stale references: `model.yaml` → `spec-model.yaml`, v1 field names (`implementation.materialization` → `physical.strategy`, `appearance.type` → `conceptual.kind`), and corrected output path to `.modscape/changes/<name>/tasks.md`.

## [3.0.0] - 2026-04-10

### Breaking Changes

This release introduces **YAML schema v2.0.0** — a complete redesign of the table schema based on a 3-layer ontology (Conceptual / Logical / Physical) plus a visual display axis. **Existing v1 YAML files must be migrated before use.**

```bash
modscape migrate <path>   # in-place migration (creates .bak backup)
```

#### Removed fields (v1 → v2 replacement)

| Removed (v1) | Replacement (v2) |
|---|---|
| `table.name` | `table.conceptual.name` |
| `table.logical_name` | `table.logical.name` |
| `table.physical_name` | `table.physical.name` |
| `table.appearance.type` | `table.conceptual.kind` |
| `table.appearance.scd` | `table.logical.scd.type` |
| `table.appearance.icon` | `table.display.icon` |
| `table.appearance.color` | `table.display.color` |
| `table.appearance.sub_type` | *(removed)* |
| `table.implementation.materialization` | `table.physical.strategy` |
| `table.implementation.incremental_strategy` | `table.physical.update_mode` (`delete+insert` → `delete_insert`) |
| `table.implementation.unique_key` | `table.physical.merge_key` |
| `table.implementation.partition_by` | `table.physical.partition` |
| `table.implementation.cluster_by` | `table.physical.cluster` |
| `table.implementation.incremental_key` | `table.physical.filter_key` |
| `table.implementation.incremental_lookback` | `table.physical.lookback` |
| `table.implementation.grain` | `table.logical.grain` |
| `table.implementation.measures` | `table.physical.measures` |
| `table.implementation.scd2` | *(merged into `table.logical.scd`)* |
| `table.conceptual.tags` | `table.metadata.tags` |
| `column.logical.{name,type,...}` | `column.{name,type,...}` (flat structure) |
| `domain.color` | `domain.display.color` |
| `consumer.appearance` | `consumer.display` |
| `annotation.type` (sticky/callout) | *(removed)* |
| `annotation.color` | `annotation.display.color` |
| `annotation.targetId` + `annotation.targetType` | `annotation.target.{id,type}` |
| `layout[id].parentId` | *(removed; domain membership declared in `domains.members`)* |

### Added

- **`modscape spec answer` command** — Answers a question in `questions.md` by Q-NNN ID. Marks the question `[x]` and appends `**A:** <answer>`. Change name can be omitted when only one active change exists; required otherwise.
  - `modscape spec answer <id> "<answer>" --change <name>`
  - `modscape spec answer <id> "<answer>"` (auto-resolves if single active change)
- **`questions.md` in SDD workflow** — `modscape spec new` now generates a `questions.md` template in `.modscape/changes/<name>/`. AI skills (requirements/design/implement) append unanswered investigation items as `Q-NNN` entries. Archive syncs all questions to `.modscape/specs/questions.md` via flat-merge per table.
- **`modscape migrate` command** — Converts v1 YAML files to v2 format via a chain-based migration system.
  - `modscape migrate <path>` — in-place migration with `.bak` backup
  - `modscape migrate <path> --dry-run` — preview without writing
  - `modscape migrate <path> --out <new>` — write to new file
  - Future v2→v3 migrations can be added as a single entry in the `MIGRATIONS` chain.
- **`table.conceptual`** — Business layer: `name` (required), `kind`, `description`, `tags`
- **`table.logical`** — Analytic layer: `name`, `grain`, `scd` (with `type`, `business_key`, `valid_from`, `valid_to`, `current_flag`)
- **`table.physical`** — Build/storage layer: `name`, `schema`, `strategy`, `update_mode`, `merge_key`, `partition`, `cluster`, `filter_key`, `lookback`, `measures`
- **`table.display`** — Visual layer: `icon`, `color`
- **`domain.display.color`** — Domain background color moved to `display.color`
- **`consumer.display`** — Consumer visual settings moved to `display` object
- **`annotation.target`** — Annotation attachment as `{ id, type }` object
- **`annotation.display.color`** — Annotation background color moved to `display.color`
- **Detail Panel redesign** — Tabs now: `conceptual | logical | physical | sample | metadata` (implementation tab removed, build settings moved to physical tab)
- **`modscape validate`** — Now warns when v1 fields (`appearance`, `implementation`, `logical_name`, etc.) are detected and suggests running `modscape migrate`

### Changed

- `MODEL_FORMAT_VERSION` bumped to `2.0.0`
- Parser now returns an error for v1 YAML (`version: "1.0.0"` or no version field) with a message directing the user to run `modscape migrate`
- All CLI mutation commands updated to use v2 field names
- `dbt import` / `dbt sync` now generate v2-schema YAML
- All AI skill templates (Claude, Gemini, Codex) updated to reference v2 fields
- `samples/1-retail-analytics.yaml` and `samples/2-conformed-dims.yaml` migrated to v2

## [2.8.0] - 2026-04-09

### Added
- **`metadata` field on tables** — Free-form key-value map at the table level for project-specific information (owner, SLA, SQL file path, sensitivity label, etc.). Any string key is accepted; values must be scalar. Preserved as-is by all CLI commands.
- **Detail Panel — Metadata tab** — New 6th tab in the table Detail Panel (`6` key shortcut). Displays metadata fields as an editable key-value form with inline add / delete support. Changes are immediately persisted to the YAML.
- **`modscape extract --with-downstream`** — New flag that recursively collects all downstream tables from the specified starting tables via BFS lineage traversal.
  - Accepts multiple starting table IDs (`--tables id1,id2,...`) and collects the union of all downstreams in a single command.
  - Works across multiple input YAMLs: lineage graphs from all input files are merged before traversal.
  - `--record` correctly maps each downstream table to the source YAML it was extracted from; unregistered source YAMLs are auto-added to `spec-config.yaml`.
  - SDD `design` skill updated to use `--with-downstream` for initial extraction. `Affected Tables` in `design.md` now distinguishes **Direct Impact** (tables specified in `--tables`) from **Downstream Impact — Implement** (downstream tables that must be updated) and **Downstream Impact — Context Only** (downstream tables collected for reference only, no code changes required). The classification is AI-proposed and editable in `design.md`.
- SDD `implement` skill now reads `design.md` and skips tables listed under `### Downstream Impact — Context Only` (outputs `⏭️ Skipping <id> (Context Only)`). Falls back to implementing all tables when `design.md` is absent.
- SDD `archive` skill now applies full spec sync only to Direct Impact and Downstream Impact — Implement tables; Context Only tables receive a Changelog-only entry. Falls back to full sync when `design.md` is absent.
- **`modscape validate` — circular lineage warning** — Detects cycles in the `lineage` graph and reports them as a warning (valid YAML, but logically incorrect model).
- **`modscape validate` — column logical completeness warning** — When a column has a `logical` section, missing `name` or `type` fields are now flagged as warnings with `(will cause UI crash)` note.

- **`columns[].expression`** — Optional SQL transformation formula per column. When set, the SDD implement skill uses it verbatim as the SELECT clause expression instead of inferring from column names.
- **`lineage[].join_type`** — Optional field on each lineage edge (`inner` | `left` | `cross` | `none`). The SDD implement skill uses it to generate the correct JOIN clause. When omitted, defaults to `left` if a `relationships` entry exists, otherwise `none`.
- **`implementation.incremental_key`** — Optional column ID specifying the timestamp/date filter column for incremental models. SDD generates `WHERE <key> > {{ last_run_timestamp() }}`.
- **`implementation.incremental_lookback`** — Optional safety margin (e.g. `"3 days"`) subtracted from the incremental filter boundary.
- **`implementation.scd2`** — Optional SCD Type2 configuration block with `business_key` (array), `valid_from`, `valid_to`, and optional `current_flag`. SDD uses it to generate MERGE/snapshot SQL without guessing column roles.
- All four fields are **optional** and backwards-compatible — existing YAML requires no changes.


### Fixed
- **Detail Panel white screen crash** — `col.logical?.name?.toLowerCase().replace()` and `col.logical?.type.toUpperCase()` crashed when `logical.name` or `logical.type` was missing. Fixed by adding `?.` to all method chains on optional fields.

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
