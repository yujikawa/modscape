---
name: modscape-spec-design
description: Design the data model based on spec.md and update changes/<name>/spec-model.yaml. Generates design.md and tasks.md.
---

# Spec Design

Design the data model based on `spec.md` and update `changes/<name>/spec-model.yaml` (the work-scoped YAML). Does NOT modify the main model.yaml directly. Also generates `design.md` and `tasks.md` in the work folder.

## Usage

```
@modscape-spec-design <name>
@modscape-spec-design <name> path/to/main.yaml
```

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
     > `changes/<name>/spec.md` not found. Run `@modscape-spec-requirements` first to create it.

3. **Check for existing `changes/<name>/spec-model.yaml`** (the work-scoped YAML).
   - If it **does not exist**: this is a first run — extract relevant tables from the main YAML (step 5).
   - If it **exists**: this may be a re-run or continuation — skip the extract step and proceed with the existing work YAML.

4. **Check for existing design.md** at `.modscape/changes/<name>/design.md`.
   - If it exists: this is a **re-run**. Read it fully and check the `## Findings` section.
     - If `### Requires Model Change` has entries: **process these first before anything else** — apply the model changes to `changes/<name>/spec-model.yaml` using mutation CLI commands, then run `modscape validate`. Only after model changes are applied, proceed to update tasks.md.
     - If `### Implementation Notes` only: no model changes needed, proceed to update tasks.md.
   - If not: this is a **first run**.

5. **Resolve main YAMLs** (first run only):

   Read `.modscape/changes/<name>/spec-config.yaml`.
   - If it exists and has `main_yamls` entries → use them.
   - If it does not exist:
     - Check `modscape-spec.custom.md` for a `Main YAMLs` setting → use it and create `spec-config.yaml`.
     - If neither found → stop and tell the user:
       > Main YAML is unknown. Run `@modscape-spec-requirements` again to set it, or create `changes/<name>/spec-config.yaml` manually.

6. **Extract relevant tables from the main YAML(s)** (first run only):

   Read `.modscape/changes/<name>/spec.md` and identify the tables to modify (Data Sources). Pass all main YAMLs from `spec-config.yaml` as inputs and use `--with-downstream` to automatically collect all downstream tables in one command:

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
   If the target main YAML is unclear, use the first entry and inform the user.

7. Read all existing `specs/*.md` files (if any) to understand current business context.

8. **Identify affected tables** from the extraction result and classify downstream tables:
   - **Direct Impact**: Tables specified in `--tables` (will be newly created or structurally modified)
   - **Downstream Impact — Implement**: Downstream tables that reference a column being added or changed in a Direct Impact table → must be updated
   - **Downstream Impact — Context Only**: Downstream tables that reference a Direct Impact table but do not use the changed columns → no code changes required, collected for reference only
   - If a downstream table has no column detail (lineage only) → classify as **Context Only** and add a comment noting that classification confidence is low

   This classification is an **AI proposal**. Write the disclaimer in `design.md` (see format below) and instruct the user to edit it directly if the classification is wrong.

9. **Surface known open questions** (first run only):

   Check `.modscape/specs/questions.md` for unresolved questions (`- [ ]`) that reference any Direct Impact table ID.
   - If matching questions exist: insert their Q-NNN IDs (not the full question text) into `design.md` under `## Known Open Questions`.
   - If no matching questions: omit the `## Known Open Questions` section entirely.

10. **Search past archives for related patterns** (first run only):

   For each Direct Impact table ID, run:
   ```bash
   modscape spec search <table-id> --json --limit 5
   ```
   - If results exist: record them in `design.md` under `## Related Past Specs`.
   - If no results: omit the `## Related Past Specs` section entirely.
   - To incorporate findings from a past spec, run `@modscape-spec-search <keyword>`.

11. Design the data model — **all changes go to `changes/<name>/spec-model.yaml`, never to the main YAML**:
   - Propose tables (with `conceptual.kind`: staging → core fact/dimension → mart)
   - Define `lineage` entries to answer: **"which tables does this table's query read from?"** — one entry per input→output pair
   - Define `relationships` entries to answer: **"which two tables share a join key?"** — one entry per FK pair, regardless of data flow direction
   - These two are independent: a pair of tables may have lineage, a relationship, both, or neither
     - If table C is built by joining A and B: lineage(A→C) + lineage(B→C); if A and B also share a FK key: relationship(A↔B)
     - If A and B share a FK but neither builds from the other: relationship only, no lineage
   - **Relationships are prerequisites for query construction.** Any JOIN between two tables requires a relationship entry defining the key and cardinality — without it, the implementer cannot write the query. If the join key is unknown, add it to `questions.md` immediately rather than leaving the relationship undefined.
     - Read `## Table Relationships` in `spec.md` and convert each entry to a `relationship`
     - Also infer from columns where `isForeignKey: true` — match by column name pattern (e.g., `customer_id` → `dim_customers.customer_id`)
     - Cover both source-to-source joins and fact ↔ dimension joins
     - When a FK relationship is ambiguous or the join key is unknown, add a question to `questions.md` instead of silently omitting it
   - Do **not** create `domains` unless the user explicitly requests it
   - Add `conceptual.description` and BEAM* tags to each table where relevant
   - Add `physical` strategy hints where the target tool and table type make them clear
   - Do **not** set `display.color` on tables — leave the `display` section unset unless the user explicitly requests a specific color

10. Apply changes using mutation CLI commands targeting `changes/<name>/spec-model.yaml`:
    ```bash
    modscape table add .modscape/changes/<name>/spec-model.yaml --id <id> --name "<name>" --type <type>
    modscape lineage add .modscape/changes/<name>/spec-model.yaml --from <from> --to <to>
    # FK relationship: --from / --to accepts "table.column" or just "table"
    modscape relationship add .modscape/changes/<name>/spec-model.yaml \
      --from <table>.<column> --to <table>.<column> --type <one-to-many|many-to-one|one-to-one|many-to-many>
    # domain add: only when explicitly requested by the user
    modscape domain add .modscape/changes/<name>/spec-model.yaml --id <id> --name "<name>"
    ```
    Edit YAML directly only for complex nested fields (`physical`, `logical.scd`, `columns`, `sampleData`, composite FK with multiple columns).

11. After all changes are applied, always run validate and fix any errors before proceeding:
    ```bash
    modscape validate .modscape/changes/<name>/spec-model.yaml
    ```

12. Write `.modscape/changes/<name>/design.md` using the format below.

13. Generate `.modscape/changes/<name>/tasks.md` using the task generation rules below.

14. Update `Status` in `.modscape/changes/<name>/spec.md` from `requirements` to `design`.

15. Review the **entire design conversation** and append entries to `.modscape/changes/<name>/questions.md` for all of the following:

   - **Answered** — questions you asked during design and the user gave a clear answer to → mark `[x]` and append the answer inline
   - **Assumed** — items you could not confirm and proceeded with an assumption → mark `[ ]` with an `**Assumption:**` line
   - **Open** — items still unresolved → mark `[ ]` with no assumption

   Use this format. Use the next available ID continuing from any existing questions:

```markdown
- [x] **Q-NNN** <question text>
  **Answer:** <answer the user gave>

- [ ] **Q-NNN** <question text>
  **Assumption:** <what you assumed to proceed> (unconfirmed)
```

   Record every question that shaped the design — answered questions are just as important for traceability as open ones.

    If there are unresolved questions (`- [ ]`) at the end of design, output:
    > ⚠ There are **N** unresolved questions (Q-NNN, ...). Answer them with `modscape spec answer <id> "<answer>"`, or proceed to implementation with `@modscape-spec-implement <name>`.

## design.md Format

```markdown
# Design: <pipeline title>

## Design Decisions
<Key design choices and their rationale>

## Affected Tables

> ⚠️ This Affected Tables classification is an AI proposal. Edit directly if the classification is incorrect.

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
- [ ] `<table_id>` — <column_id>: unique, not_null  [→ AC-001, AC-003]
- [ ] `<table_a>` → `<table_b>` FK test             [→ AC-002]
- [ ] AC-NNN: <AC text>                             [手動検証]
```

Append `[→ AC-NNN]` to each test task that validates a corresponding AC from `spec.md`. Add `[manual verification]` lines for ACs that cannot be auto-tested. Omit annotations if `spec.md` has no AC-NNN entries.

## Next Step

**Always output the following at the end, without exception. Build the review summary from the actual state of the files:**

---
✅ Design complete. `tasks.md` generated at `.modscape/changes/<name>/tasks.md`

## Review Checkpoint

**Unresolved Questions:** N — Q-NNN, Q-NNN
**Assumptions:** N
**AC Coverage:** N/M (✅ covered / 🔧 manual / ❌ uncovered)
**Downstream Classification (Low Confidence):** `<table-id>` or none

**Next steps:**
```
@modscape-spec-implement <name>
@modscape-spec-review <name>
```
---
