Sync permanent table specs in `.modscape/specs/` from a completed SDD work folder.

## Usage

```
/modscape:sdd:archive <name>
```

`<name>` is the work folder name (e.g., `monthly-sales-summary`).

## Instructions

1. Verify that `.modscape/sdd/<name>/` exists.
   - If not: stop and tell the user:
     > `sdd/<name>/` not found. Please check the folder name.

2. Read the following files:
   - `.modscape/sdd/<name>/spec.md` — pipeline goal, stakeholders, data sources
   - `.modscape/sdd/<name>/design.md` — design decisions, affected tables list, findings
   - `model.yaml` — current table definitions and lineage

3. **Identify affected tables** from `design.md`:
   - **Direct impact tables**: listed under `## Affected Tables > ### Direct Impact`
   - **Indirect impact tables**: listed under `## Affected Tables > ### Indirect Impact`
   - If `design.md` does not exist or has no affected tables section: infer from `model.yaml` lineage by comparing spec.md data sources with current lineage graph.

4. **Sync `specs/<table-id>.md` for direct impact tables**:

   For each directly affected table:

   a. Check whether `.modscape/specs/<table-id>.md` exists.
      - If **not**: create a new file using the format below, extracting content from `spec.md`, `design.md`, and the table's definition in `model.yaml`.
      - If **exists**: read the current file and update only the relevant sections (Overview, Business Context, Business Rules, Known Issues). Preserve sections not related to this SDD work.

   b. Append a Changelog entry:
      ```
      - <YYYY-MM-DD>: <brief description of change> (SDD: <name>)
      ```

5. **Update Changelog only for indirect impact tables**:

   For each indirectly affected table that has an existing `specs/<table-id>.md`:
   - Append a Changelog entry noting the downstream change:
     ```
     - <YYYY-MM-DD>: Referenced by new downstream pipeline (SDD: <name>)
     ```
   - Do not modify other sections.

6. **Report the sync result** to the user:
   > Synced specs for:
   > - Created: `specs/mart_monthly_sales.md`
   > - Updated: `specs/fct_orders.md`, `specs/dim_customers.md`
   > - Changelog only: `specs/stg_raw_orders.md`

7. **Ask the user whether to delete the work folder**:
   > Sync complete. Delete `sdd/<name>/`? (y / n — keep it as a reference)

   - If yes: delete the `.modscape/sdd/<name>/` directory.
   - If no: leave it in place.

## `specs/<table-id>.md` Format

```markdown
# <table-id>

## Overview
- **Owner**: <from spec.md stakeholders.owner>
- **Update Frequency**: <inferred from implementation.* or spec.md>
- **SLA**: <from spec.md if available, otherwise "—">

## Business Context
<Business meaning of this table — derived from spec.md Goal and table's conceptual.description>

## Business Rules
- <Key business rule or calculation logic — from design.md or model.yaml implementation hints>

## Known Issues / Caveats
- <From design.md ## Findings section, if any>

## Changelog
- <YYYY-MM-DD>: 初版 (SDD: <name>)
```

## Spec Progress Check

After sync, you may also report the overall spec coverage:

```
Spec coverage: <n>/<total> tables have permanent specs.
Tables without specs: <list of table IDs with no specs/<id>.md>
```

This helps the user understand which tables still lack business documentation.
