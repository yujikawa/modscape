Design the data model based on `spec.md` and update `model.yaml`. Also generates `design.md` and `tasks.md` in the work folder.

## Usage

```
/modscape:sdd:design <name>
/modscape:sdd:design <name> path/to/model.yaml
```

`<name>` is the work folder name created by `/modscape:sdd:requirements` (e.g., `monthly-sales-summary`).

## Instructions

1. Read `.modscape/rules.md` to understand the YAML schema and modeling rules.
   If `.modscape/sdd/sdd.custom.md` exists, read it too — its rules take **priority**.

2. Check that `.modscape/sdd/<name>/spec.md` exists.
   - If it does not exist: stop and tell the user:
     > `sdd/<name>/spec.md` not found. Run `/modscape:sdd:requirements` first to create it.

3. **Check for existing design.md** at `.modscape/sdd/<name>/design.md`.
   - If it exists: this is a **re-run**. Read it fully and look for a `## Findings` section containing observations from running the pipeline with real data. Incorporate these findings into the design.
   - If not: this is a **first run**.

4. Read `.modscape/sdd/<name>/spec.md` fully. Extract:
   - **Goal** — the purpose of the pipeline
   - **Data Sources** — what tables/systems feed the pipeline
   - **Acceptance Criteria** — what the output must deliver
   - **Target Tool** — dbt / SQLMesh / Spark SQL / plain SQL

5. Read all existing `specs/*.md` files (if any) to understand the current business context of tables that may be affected.

6. **Identify affected tables** by cross-referencing spec.md with `model.yaml` lineage:
   - **Direct impact**: Tables that will be newly created or structurally modified
   - **Indirect impact**: Tables that exist in the upstream lineage of direct-impact tables
   Record both lists — they will be written to `design.md`.

7. Design the data model:
   - Propose tables (with `appearance.type`: staging → core fact/dimension → mart)
   - Define `lineage` entries to express data flow between tables
   - Group related tables into `domains`
   - Add `conceptual.description` and BEAM* tags to each table where relevant
   - Add `implementation` hints (materialization, incremental strategy, grain, measures) where the target tool and table type make them clear
   - On re-run: incorporate `## Findings` from `design.md` before applying changes

8. Apply changes to `model.yaml` using mutation CLI commands where possible:
   ```bash
   modscape table add model.yaml --id <id> --name "<name>" --type <type>
   modscape domain add model.yaml --id <id> --name "<name>"
   modscape lineage add model.yaml --from <from> --to <to>
   ```
   Edit YAML directly only for complex nested fields (`implementation`, `columns`, `sampleData`).

9. After all tables are added, run:
   ```bash
   modscape layout model.yaml
   ```

10. Write `.modscape/sdd/<name>/design.md` using the format below.
    - On first run: create the file with design decisions and affected tables.
    - On re-run: preserve the existing `## Findings` section; update `## Design Decisions` and `## Affected Tables` sections only.

11. Generate `.modscape/sdd/<name>/tasks.md` using the task generation rules below.
    - On re-run: preserve completed tasks (`- [x]`); regenerate only pending (`- [ ]`) tasks based on current `model.yaml` state.

12. Update `Status` in `.modscape/sdd/<name>/spec.md` from `requirements` to `design`.

## design.md Format

```markdown
# Design: <pipeline title>

## Design Decisions
<Key design choices and their rationale — updated on each re-run>

## Affected Tables

### Direct Impact
- `<table-id>`: <reason (new / column added / restructured)>

### Indirect Impact
- `<table-id>`: upstream dependency (Changelog will be updated on archive)

## Findings
<This section is written by the user or AI during implementation.>
<Add observations from running the pipeline with real data here.>
<Example:>
<- `fct_orders`: NULL rate for customer_id was 12% — need to handle gracefully>
<- Grain was off: one row per order line, not per order — redesigned>
```

## Task Generation Rules

Build a dependency graph from `lineage` entries (`from` → `to`), then topologically sort all tables.

Assign each table to a phase based on its depth in the dependency graph:
- **Phase 1 — Staging**: tables with no upstream dependencies (leaf sources)
- **Phase 2 — Core**: tables that depend only on Phase 1 tables (facts, dimensions, hubs, links, satellites)
- **Phase 3 — Mart**: tables furthest downstream (mart type, or aggregated outputs)
- **Phase 4 — Tests**: one test task per table that has a primary key column or foreign key column

For each task, include:
- Table ID in backticks
- Materialization type in brackets (from `implementation.materialization` or inferred from `appearance.type`)
- Upstream dependencies with `←` notation (omit for Phase 1)

### tasks.md Format

```markdown
# Pipeline Tasks
> Generated from: model.yaml
> Spec: .modscape/sdd/<name>/spec.md
> Progress: 0 / <total>

## Phase 1: Staging
- [ ] `<table_id>` [<materialization>]

## Phase 2: Core
- [ ] `<table_id>` [<materialization>] ← <upstream_1>, <upstream_2>

## Phase 3: Mart
- [ ] `<table_id>` [<materialization>] ← <upstream_1>

## Phase 4: Tests
- [ ] `<table_id>` — <column_id>: unique, not_null
- [ ] `<table_a>` → `<table_b>` FK test
```

## Next Step

After updating `model.yaml` and generating `tasks.md`, guide the user:

> Design complete. `tasks.md` has been generated at `.modscape/sdd/<name>/tasks.md`.
> Run `/modscape:sdd:implement <name>` to start implementation.
>
> If you run the pipeline and discover issues, add them to the `## Findings` section
> in `.modscape/sdd/<name>/design.md`, then re-run `/modscape:sdd:design <name>` to update the design.
