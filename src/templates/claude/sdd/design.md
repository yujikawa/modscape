Design the data model based on `spec.md` and update `sdd/<name>/model.yaml` (the work-scoped YAML). Does NOT modify the master model.yaml (e.g., HR.yaml) directly. Also generates `design.md` and `tasks.md` in the work folder.

## Usage

```
/modscape:sdd:design <name>
/modscape:sdd:design <name> path/to/master.yaml
```

`<name>` is the work folder name created by `/modscape:sdd:requirements` (e.g., `monthly-sales-summary`).
`path/to/master.yaml` is the master model file (default: `model.yaml` in the current directory).

## Instructions

1. Read `.modscape/rules.md` to understand the YAML schema and modeling rules.
   If `.modscape/sdd/sdd.custom.md` exists, read it too — its rules take **priority**.

2. Check that `.modscape/sdd/<name>/spec.md` exists.
   - If it does not exist: stop and tell the user:
     > `sdd/<name>/spec.md` not found. Run `/modscape:sdd:requirements` first to create it.

3. **Check for existing `sdd/<name>/model.yaml`** (the work-scoped YAML).
   - If it **does not exist**: this is a first run — extract relevant tables from the master YAML (step 5).
   - If it **exists**: this may be a re-run or continuation — skip the extract step and proceed with the existing work YAML.

4. **Check for existing design.md** at `.modscape/sdd/<name>/design.md`.
   - If it exists: this is a **re-run**. Read it fully and look for a `## Findings` section. Incorporate findings into the design.
   - If not: this is a **first run**.

5. **Extract relevant tables from the master YAML** (first run only):

   Read `.modscape/sdd/<name>/spec.md` and identify the **Data Sources** — the existing tables referenced by the pipeline. Then run:

   ```bash
   modscape extract <master>.yaml --tables <id1>,<id2>,... --output .modscape/sdd/<name>/model.yaml
   ```

   If Data Sources are unclear or the master YAML does not exist, create an empty `sdd/<name>/model.yaml` with:
   ```yaml
   tables: []
   ```
   and inform the user which tables could not be found.

6. Read all existing `specs/*.md` files (if any) to understand current business context.

7. **Identify affected tables** by cross-referencing spec.md with the lineage in `sdd/<name>/model.yaml`:
   - **Direct impact**: Tables that will be newly created or structurally modified
   - **Indirect impact**: Tables that exist upstream in lineage of direct-impact tables

8. Design the data model — **all changes go to `sdd/<name>/model.yaml`, never to the master YAML**:
   - Propose tables (with `appearance.type`: staging → core fact/dimension → mart)
   - Define `lineage` entries to express data flow between tables
   - Group related tables into `domains`
   - Add `conceptual.description` and BEAM* tags to each table where relevant
   - Add `implementation` hints where the target tool and table type make them clear
   - On re-run: incorporate `## Findings` from `design.md` before applying changes

9. Apply changes using mutation CLI commands targeting `sdd/<name>/model.yaml`:
   ```bash
   modscape table add .modscape/sdd/<name>/model.yaml --id <id> --name "<name>" --type <type>
   modscape domain add .modscape/sdd/<name>/model.yaml --id <id> --name "<name>"
   modscape lineage add .modscape/sdd/<name>/model.yaml --from <from> --to <to>
   ```
   Edit YAML directly only for complex nested fields (`implementation`, `columns`, `sampleData`).

10. After all changes are applied, always run validate and fix any errors before proceeding:
    ```bash
    modscape validate .modscape/sdd/<name>/model.yaml
    ```

11. Write `.modscape/sdd/<name>/design.md` using the format below.
    - On first run: create with design decisions and affected tables.
    - On re-run: preserve `## Findings`; update `## Design Decisions` and `## Affected Tables` only.

12. Generate `.modscape/sdd/<name>/tasks.md` using the task generation rules below.
    - On re-run: preserve completed tasks (`- [x]`); regenerate only pending (`- [ ]`) tasks.

13. Update `Status` in `.modscape/sdd/<name>/spec.md` from `requirements` to `design`.

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

Build a dependency graph from `lineage` entries in `sdd/<name>/model.yaml`, then topologically sort.

Assign each table to a phase:
- **Phase 1 — Staging**: tables with no upstream dependencies
- **Phase 2 — Core**: tables that depend only on Phase 1 tables
- **Phase 3 — Mart**: tables furthest downstream
- **Phase 4 — Tests**: one test task per table with a primary key or foreign key column

For each task, include:
- Table ID in backticks
- Materialization type in brackets
- Upstream dependencies with `←` notation (omit for Phase 1)

### tasks.md Format

```markdown
# Pipeline Tasks
> Generated from: sdd/<name>/model.yaml
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

After updating `sdd/<name>/model.yaml` and generating `tasks.md`, guide the user:

> Design complete. `tasks.md` has been generated at `.modscape/sdd/<name>/tasks.md`.
> Run `/modscape:sdd:implement <name>` to start implementation.
>
> To preview the model: `modscape dev .modscape/sdd/<name>/model.yaml`
>
> If you run the pipeline and discover issues, add them to the `## Findings` section
> in `.modscape/sdd/<name>/design.md`, then re-run `/modscape:sdd:design <name>` to update the design.
