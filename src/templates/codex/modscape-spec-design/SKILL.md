---
name: modscape-spec-design
description: Design the data model based on spec.md and update changes/<name>/model.yaml. Generates design.md and tasks.md.
---

# Spec Design

Design the data model based on `spec.md` and update `changes/<name>/model.yaml` (the work-scoped YAML). Does NOT modify the master model.yaml directly. Also generates `design.md` and `tasks.md` in the work folder.

## Instructions

1. Read `.modscape/rules.md` to understand the YAML schema and modeling rules.
   If `.modscape/changes/modscape-spec.custom.md` exists, read it too — its rules take **priority**.

   **When reading model information, always use modscape CLI commands or MCP tools — do not use `grep` or direct file reads unless the information is genuinely unavailable from CLI:**
   ```bash
   modscape table list <file>
   modscape table get <file> --id <id>
   modscape lineage list <file>
   modscape summary <file> --json
   ```

2. Check that `.modscape/changes/<name>/spec.md` exists.
   - If it does not exist: stop and tell the user:
     > `changes/<name>/spec.md` not found. Run `/modscape:spec:requirements` first to create it.

3. **Check for existing `changes/<name>/model.yaml`** (the work-scoped YAML).
   - If it **does not exist**: this is a first run — extract relevant tables from the master YAML (step 5).
   - If it **exists**: this may be a re-run or continuation — skip the extract step and proceed with the existing work YAML.

4. **Check for existing design.md** at `.modscape/changes/<name>/design.md`.
   - If it exists: this is a **re-run**. Read it fully and check the `## Findings` section.
     - If `### Requires Model Change` has entries: **process these first before anything else** — apply the model changes to `changes/<name>/model.yaml` using mutation CLI commands, then run `modscape validate`. Only after model changes are applied, proceed to update tasks.md.
     - If `### Implementation Notes` only: no model changes needed, proceed to update tasks.md.
   - If not: this is a **first run**.

5. **Resolve master YAMLs** (first run only):

   Read `.modscape/changes/<name>/spec-config.yaml`.
   - If it exists and has `master_yamls` entries → use them.
   - If it does not exist:
     - Check `modscape-spec.custom.md` for a `Master YAMLs` setting → use it and create `spec-config.yaml`.
     - If neither found → stop and tell the user:
       > Master YAML is unknown. Run `/modscape:spec:requirements` again to set it, or create `changes/<name>/spec-config.yaml` manually.

6. **Extract relevant tables from the master YAML(s)** (first run only):

   Read `.modscape/changes/<name>/spec.md` and identify the **Data Sources**. For each master YAML, run extract with `--append` and `--record` so the source mapping is recorded automatically:

   ```bash
   # First master YAML (creates model.yaml)
   modscape extract <master1>.yaml \
     --tables <id1>,<id2>,... \
     --output .modscape/changes/<name>/model.yaml \
     --record .modscape/changes/<name>/spec-config.yaml

   # Additional master YAMLs (upsert into existing model.yaml)
   modscape extract <master2>.yaml \
     --tables <id3>,... \
     --output .modscape/changes/<name>/model.yaml \
     --append \
     --record .modscape/changes/<name>/spec-config.yaml
   ```

   When tables are added or removed during design, always update `spec-config.yaml` manually to keep it in sync.
   If the target master YAML is unclear, use the first entry and inform the user.

7. Read all existing `specs/*.md` files (if any) to understand current business context.

8. **Identify affected tables** by cross-referencing spec.md with the lineage in `changes/<name>/model.yaml`.

9. Design the data model — **all changes go to `changes/<name>/model.yaml`, never to the master YAML**:
   - Propose tables (with `appearance.type`: staging → core fact/dimension → mart)
   - Define `lineage` entries to express data flow between tables
   - Do **not** create `domains` unless the user explicitly requests it
   - Add `conceptual.description` and BEAM* tags to each table where relevant
   - Add `implementation` hints where the target tool and table type make them clear

10. Apply changes using mutation CLI commands targeting `changes/<name>/model.yaml`:
    ```bash
    modscape table add .modscape/changes/<name>/model.yaml --id <id> --name "<name>" --type <type>
    modscape lineage add .modscape/changes/<name>/model.yaml --from <from> --to <to>
    # domain add: only when explicitly requested by the user
    modscape domain add .modscape/changes/<name>/model.yaml --id <id> --name "<name>"
    ```
    Edit YAML directly only for complex nested fields (`implementation`, `columns`, `sampleData`).

11. After all changes are applied, always run validate and fix any errors before proceeding:
    ```bash
    modscape validate .modscape/changes/<name>/model.yaml
    ```

12. Write `.modscape/changes/<name>/design.md` using the format below.

13. Generate `.modscape/changes/<name>/tasks.md` using the task generation rules below.

14. Update `Status` in `.modscape/changes/<name>/spec.md` from `requirements` to `design`.

## design.md Format

```markdown
# Design: <pipeline title>

## Design Decisions
<Key design choices and their rationale>

## Affected Tables

### Direct Impact
- `<table-id>`: <reason (new / column added / restructured)>

### Indirect Impact
- `<table-id>`: upstream dependency (Changelog will be updated on archive)

## Findings

### Requires Model Change
<Observations that require changes to model.yaml — processed first on re-run>

### Implementation Notes
<Observations that do NOT require model changes — for reference only>
```

## Task Generation Rules

Build a dependency graph from `lineage` entries in `changes/<name>/model.yaml`, then topologically sort.

- **Phase 1 — Staging**: tables with no upstream dependencies
- **Phase 2 — Core**: tables that depend only on Phase 1 tables
- **Phase 3 — Mart**: tables furthest downstream
- **Phase 4 — Tests**: one test task per table with a primary key or foreign key column

### tasks.md Format

```markdown
# Pipeline Tasks
> Generated from: changes/<name>/model.yaml

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

## COMMAND: /modscape:spec:design

Usage: `/modscape:spec:design <name> [path/to/master.yaml]`

**Always output the following message at the end, without exception:**

---
✅ Design complete. `tasks.md` generated at `.modscape/changes/<name>/tasks.md`

**Next step:**
```
/modscape:spec:implement <name>
```

To preview the model:
```
modscape dev .modscape/changes/<name>/model.yaml
```

If you discover issues during implementation, add them to `## Findings` in `.modscape/changes/<name>/design.md`, then re-run `/modscape:spec:design <name>` to update the design.
---
