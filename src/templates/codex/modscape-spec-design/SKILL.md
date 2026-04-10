---
name: modscape-spec-design
description: Design the data model based on spec.md and update changes/<name>/spec-model.yaml. Generates design.md and tasks.md.
---

# Spec Design

Design the data model based on `spec.md` and update `changes/<name>/spec-model.yaml` (the work-scoped YAML). Does NOT modify the master model.yaml directly. Also generates `design.md` and `tasks.md` in the work folder.

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

3. **Check for existing `changes/<name>/spec-model.yaml`** (the work-scoped YAML).
   - If it **does not exist**: this is a first run — extract relevant tables from the master YAML (step 5).
   - If it **exists**: this may be a re-run or continuation — skip the extract step and proceed with the existing work YAML.

4. **Check for existing design.md** at `.modscape/changes/<name>/design.md`.
   - If it exists: this is a **re-run**. Read it fully and check the `## Findings` section.
     - If `### Requires Model Change` has entries: **process these first before anything else** — apply the model changes to `changes/<name>/spec-model.yaml` using mutation CLI commands, then run `modscape validate`. Only after model changes are applied, proceed to update tasks.md.
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

   Read `.modscape/changes/<name>/spec.md` and identify the tables to modify (Data Sources). Pass all master YAMLs from `spec-config.yaml` as inputs and use `--with-downstream` to automatically collect all downstream tables in one command:

   ```bash
   modscape extract <master1>.yaml <master2>.yaml ... \
     --tables <id1>,<id2>,... \
     --with-downstream \
     --output .modscape/changes/<name>/spec-model.yaml \
     --record .modscape/changes/<name>/spec-config.yaml
   ```

   - `--tables`: comma-separated IDs of the tables being **directly modified**
   - `--with-downstream`: recursively collects all downstream tables across all input YAMLs using BFS, producing the union of all downstreams
   - `--record`: automatically records which tables came from which source YAML in `spec-config.yaml`

   When tables are added or removed during design, always update `spec-config.yaml` manually to keep it in sync.
   If the target master YAML is unclear, use the first entry and inform the user.

7. Read all existing `specs/*.md` files (if any) to understand current business context.

8. **Identify affected tables** from the extraction result and classify downstream tables:
   - **Direct Impact**: Tables specified in `--tables` (will be newly created or structurally modified)
   - **Downstream Impact — Implement**: Downstream tables that reference a column being added or changed in a Direct Impact table → must be updated
   - **Downstream Impact — Context Only**: Downstream tables that reference a Direct Impact table but do not use the changed columns → no code changes required, collected for reference only
   - If a downstream table has no column detail (lineage only) → classify as **Context Only** and add a comment noting that classification confidence is low

   This classification is an **AI proposal**. Write the disclaimer in `design.md` (see format below) and instruct the user to edit it directly if the classification is wrong.

9. Design the data model — **all changes go to `changes/<name>/spec-model.yaml`, never to the master YAML**:
   - Propose tables (with `appearance.type`: staging → core fact/dimension → mart)
   - Define `lineage` entries to express data flow between tables
   - Do **not** create `domains` unless the user explicitly requests it
   - Add `conceptual.description` and BEAM* tags to each table where relevant
   - Add `physical` strategy hints where the target tool and table type make them clear

10. Apply changes using mutation CLI commands targeting `changes/<name>/spec-model.yaml`:
    ```bash
    modscape table add .modscape/changes/<name>/spec-model.yaml --id <id> --name "<name>" --type <type>
    modscape lineage add .modscape/changes/<name>/spec-model.yaml --from <from> --to <to>
    # domain add: only when explicitly requested by the user
    modscape domain add .modscape/changes/<name>/spec-model.yaml --id <id> --name "<name>"
    ```
    Edit YAML directly only for complex nested fields (`physical`, `logical.scd`, `columns`, `sampleData`).

11. After all changes are applied, always run validate and fix any errors before proceeding:
    ```bash
    modscape validate .modscape/changes/<name>/spec-model.yaml
    ```

12. Write `.modscape/changes/<name>/design.md` using the format below.

13. Generate `.modscape/changes/<name>/tasks.md` using the task generation rules below.

14. Update `Status` in `.modscape/changes/<name>/spec.md` from `requirements` to `design`.

15. Review design decisions and model changes for any items that require human investigation (e.g. column definitions unknown, source table existence unconfirmed, business logic unclear). For each such item, append a question to `.modscape/changes/<name>/questions.md`. Use the next available ID continuing from any existing questions.

```markdown
- [ ] **Q-NNN** <question text>
  **Assumption:** <what you assumed to proceed> (unconfirmed)
```

    If there are unresolved questions (`- [ ]`) at the end of design, output:
    > ⚠ **Q-NNN** 件の未解決の質問があります。`modscape spec answer <id> "<回答>"` で回答するか、このまま実装に進む場合は `/modscape:spec:implement <name>` を実行してください。

## design.md Format

```markdown
# Design: <pipeline title>

## Design Decisions
<Key design choices and their rationale>

## Affected Tables

> ⚠️ この Affected Tables 分類は AI の提案です。内容が異なる場合は直接編集してください。

### Direct Impact
- `<table-id>`: <reason (new / column added / restructured)>

### Downstream Impact — Implement
- `<table-id>`: <which changed column is referenced and why this table must be updated>

### Downstream Impact — Context Only
- `<table-id>`: <why no code change is needed — e.g., does not reference changed columns>

## Findings

### Requires Model Change
<Observations that require changes to spec-model.yaml — processed first on re-run>

### Implementation Notes
<Observations that do NOT require model changes — for reference only>
```

## Task Generation Rules

Build a dependency graph from `lineage` entries in `changes/<name>/spec-model.yaml`, then topologically sort.

- **Phase 1 — Staging**: tables with no upstream dependencies
- **Phase 2 — Core**: tables that depend only on Phase 1 tables
- **Phase 3 — Mart**: tables furthest downstream
- **Phase 4 — Tests**: one test task per table with a primary key or foreign key column

### tasks.md Format

```markdown
# Pipeline Tasks
> Generated from: changes/<name>/spec-model.yaml

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
modscape dev .modscape/changes/<name>/spec-model.yaml
```

If you discover issues during implementation, add them to `## Findings` in `.modscape/changes/<name>/design.md`, then re-run `/modscape:spec:design <name>` to update the design.
---
