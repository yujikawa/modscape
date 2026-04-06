Merge the work-scoped YAML back into the master model, then sync permanent table specs in `.modscape/specs/`.

## Usage

```
/modscape:sdd:archive <name>
/modscape:sdd:archive <name> path/to/master.yaml
```

`<name>` is the work folder name (e.g., `monthly-sales-summary`).
`path/to/master.yaml` is the master model file (default: `model.yaml` in the current directory).

## Instructions

1. Verify that `.modscape/sdd/<name>/` exists and contains `model.yaml`.
   - If not: stop and tell the user:
     > `sdd/<name>/model.yaml` not found. Run `/modscape:sdd:design <name>` first.

2. Read the following files:
   - `.modscape/sdd/<name>/spec.md`
   - `.modscape/sdd/<name>/design.md`
   - `.modscape/sdd/<name>/model.yaml`

### Step 1: Merge work YAML into master YAML

3. Run the merge with spec-first ordering (spec version wins on duplicate IDs):
   ```bash
   modscape merge .modscape/sdd/<name>/model.yaml <master>.yaml --output <master>.yaml
   ```

4. Check the merge output for duplicate table ID warnings.
   If any duplicates were detected, report them to the user:
   > ⚠ The following tables existed in both the work YAML and the master YAML.
   > The spec version was used: `<table-id>`, `<table-id>`
   > Please verify the master YAML diff looks correct.

### Step 2: Sync permanent table specs

5. **Identify affected tables** from `design.md`:
   - **Direct impact tables**: listed under `## Affected Tables > ### Direct Impact`
   - **Indirect impact tables**: listed under `## Affected Tables > ### Indirect Impact`
   - If `design.md` has no affected tables section: infer from `sdd/<name>/model.yaml` lineage.

6. **Sync `specs/<table-id>.md` for direct impact tables**:

   For each directly affected table:

   a. Check whether `.modscape/specs/<table-id>.md` exists.
      - If **not**: create a new file using the format below.
      - If **exists**: update only the relevant sections; preserve unrelated content.

   b. Append a Changelog entry:
      ```
      - <YYYY-MM-DD>: <brief description of change> (SDD: <name>)
      ```

7. **Update Changelog only for indirect impact tables**:
   - Append: `- <YYYY-MM-DD>: Referenced by new downstream pipeline (SDD: <name>)`

8. **Report the sync result**:
   > Merged into master YAML ✓
   > Synced specs:
   > - Created: `specs/mart_monthly_sales.md`
   > - Updated: `specs/fct_orders.md`
   > - Changelog only: `specs/stg_raw_orders.md`

### Step 3: Cleanup

9. **Ask the user whether to delete the work folder**:
   > Archive complete. Delete `sdd/<name>/`? (y / n — keep it as a reference)

   - If yes: delete the `.modscape/sdd/<name>/` directory.
   - If no: leave it in place.

10. Show spec coverage summary:
    ```
    Spec coverage: <n>/<total> tables have permanent specs.
    Tables without specs: <list>
    ```

## `specs/<table-id>.md` Format

```markdown
# <table-id>

## Overview
- **Owner**: <from spec.md stakeholders.owner>
- **Update Frequency**: <inferred from implementation.* or spec.md>
- **SLA**: <from spec.md if available, otherwise "—">

## Business Context
<Business meaning of this table>

## Business Rules
- <Key business rule or calculation logic>

## Known Issues / Caveats
- <From design.md ## Findings section, if any>

## Changelog
- <YYYY-MM-DD>: 初版 (SDD: <name>)
```
