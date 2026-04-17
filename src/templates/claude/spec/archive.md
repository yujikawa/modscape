Merge the work-scoped YAML back into the main model, then sync permanent table specs in `.modscape/specs/`.

## Usage

```
/modscape:spec:archive <name>
/modscape:spec:archive <name> path/to/master.yaml
```

`<name>` is the work folder name (e.g., `monthly-sales-summary`).
`path/to/main.yaml` is the main model file (default: `model.yaml` in the current directory).

## Instructions

**When reading model information, always use modscape CLI commands or MCP tools — do not use `grep` or direct file reads unless the information is genuinely unavailable from CLI:**
```bash
modscape table list <file>
modscape table get <file> --id <id>
modscape lineage list <file>
modscape summary <file> --json
```

1. Verify that `.modscape/changes/<name>/` exists and contains `spec-model.yaml`.
   - If not: stop and tell the user:
     > `changes/<name>/spec-model.yaml` not found. Run `/modscape:spec:design <name>` first.

2. Read the following files:
   - `.modscape/changes/<name>/spec.md`
   - `.modscape/changes/<name>/spec-config.yaml`
   - `.modscape/changes/<name>/design.md`
   - `.modscape/changes/<name>/spec-model.yaml`

   From `design.md`, build the **affected tables classification**:
   - **Direct Impact** tables: listed under `### Direct Impact`
   - **Downstream Impact — Implement** tables: listed under `### Downstream Impact — Implement`
   - **Downstream Impact — Context Only** tables: listed under `### Downstream Impact — Context Only`
   - If `design.md` does not exist or has no `## Affected Tables` section: treat all tables in `spec-model.yaml` as Direct Impact (backwards compatible).

### Step 1: Dry-run — show merge preview and confirm

3. Build and display the merge preview **before** executing any merge:

   - Read `spec-model.yaml` and compare table IDs against each main YAML listed in `spec-config.yaml`:
     - **追加するテーブル**: table IDs present in `spec-model.yaml` but not in the main YAML
     - **更新するテーブル**: table IDs present in both; list key field changes (added/removed columns, updated `physical.strategy`, etc.)
     - **変更なし**: Downstream Impact — Context Only tables that will be merged but have no structural changes

   Display the preview:
   ```
   ## Merge Preview

   追加するテーブル:  fct_new_table, stg_source_x
   更新するテーブル:  fct_orders（+2 columns: revenue_net, tax_amount）
   変更なし:          dim_customers（Context Only）

   このまま <master>.yaml にマージしますか？ (y/N)
   ```

   Wait for user confirmation:
   - If confirmed (y/yes): proceed to Step 2.
   - If declined (N/no/anything else): stop and output:
     > Archive cancelled. No changes were made to the main YAML.

### Step 2: Merge work YAML into main YAML(s)

5. For each main YAML listed in `spec-config.yaml`, extract only the tables assigned to it and merge:
   ```bash
   modscape extract .modscape/changes/<name>/spec-model.yaml --tables <ids-for-this-yaml> --output /tmp/spec-slice.yaml
   modscape merge <master>.yaml /tmp/spec-slice.yaml --output <master>.yaml --patch
   ```

   If `spec-config.yaml` has only one main YAML, merge the entire work YAML directly:
   ```bash
   modscape merge <master>.yaml .modscape/changes/<name>/spec-model.yaml --output <master>.yaml --patch
   ```

6. Check the merge output for duplicate table ID warnings.
   If any duplicates were detected, report them to the user:
   > ⚠ The following tables existed in both the work YAML and the main YAML.
   > The spec version was used: `<table-id>`, `<table-id>`
   > Please verify the main YAML diff looks correct.

7. Run validate on each merged main YAML and fix any errors before proceeding:
   ```bash
   modscape validate <master>.yaml
   ```

### Step 2: Sync permanent table specs

5. Use the **affected tables classification** built in step 2 above.

6. **Full spec sync for Direct Impact and Downstream Impact — Implement tables**:

   For each table in **Direct Impact** or **Downstream Impact — Implement**:

   a. Check whether `.modscape/specs/<table-id>.md` exists.
      - If **not**: create a new file using the format below.
      - If **exists**: update only the relevant sections (Overview, Business Context, Business Rules, Known Issues); preserve unrelated content.

   b. Append a Changelog entry:
      ```
      - <YYYY-MM-DD>: <brief description of change> (SDD: <name>)
      ```

7. **Changelog only for Downstream Impact — Context Only tables**:
   - Do **not** perform a full spec sync for these tables.
   - Only append a Changelog entry to `.modscape/specs/<table-id>.md` (create the file with minimal content if it does not exist):
     - Append: `- <YYYY-MM-DD>: Referenced in downstream lineage; no structural change required (SDD: <name>)`

8. **Report the sync result**:
   > Merged into main YAML ✓
   > Synced specs:
   > - Created: `specs/mart_monthly_sales.md`
   > - Updated: `specs/fct_orders.md`
   > - Changelog only: `specs/stg_raw_orders.md`

### Step 3: Sync questions.md

9. If `.modscape/changes/<name>/questions.md` exists, sync it to `.modscape/specs/questions.md` using flat merge per table:

   **Merge rules:**
   - Read the existing `.modscape/specs/questions.md` (create it if absent with `# Questions\n\n## Pipeline-level\n\n## Table-level\n`)
   - For each table section in `changes/<name>/questions.md`: find or create the matching `### <table-id>` section in `specs/questions.md`
   - Append new questions that do not already exist (compare by question text, not ID)
   - For questions that were answered (`[x]`) in this change, update the corresponding unresolved entry in `specs/questions.md` if one exists
   - If a previously recorded question in `specs/questions.md` is now invalidated by this change (e.g. the column was removed, the table was restructured), add a strikethrough note:
     `~~- [ ] **Q-NNN** <original question>~~ <!-- <name>: <reason e.g. column removed> -->`
   - Append `<!-- <name> -->` as a comment after each newly added question line
   - Pipeline-level questions are merged into the `## Pipeline-level` section similarly

### Step 4: Move to archives

10. Move the work folder to `.modscape/archives/YYYY-MM-DD-<name>/` (today's date):
    ```bash
    mkdir -p .modscape/archives
    mv .modscape/changes/<name> .modscape/archives/YYYY-MM-DD-<name>
    ```

11. **Always output the following summary at the end, without exception:**

---
✅ Archive complete.

**Synced specs:**
- Created: `specs/<table-id>.md` ...
- Updated: `specs/<table-id>.md` ...
- Changelog only: `specs/<table-id>.md` ...

**Questions synced:** `specs/questions.md` updated (<n> questions added/updated).

**Spec coverage:** <n>/<total> tables have permanent specs.
Tables without specs: <list or "none">

**AC Coverage:** *(read from `tasks.md` `[→ AC-NNN]` and `[手動検証]` markers; omit if no AC-NNN in spec.md)*
- ✅ Test covered: AC-001, AC-003 (<n> 件)
- 🔧 Manual verification: AC-002 (<n> 件) — requires manual check
- ❌ Uncovered: AC-005 (<n> 件) — closed without verification

🎉 All work for this spec is complete!
---

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
