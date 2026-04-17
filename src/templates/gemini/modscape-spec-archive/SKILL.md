---
name: modscape-spec-archive
description: Merge the work-scoped YAML back into the main model, sync permanent table specs, and move the work folder to archives.
---

# Spec Archive

Merge the work-scoped YAML back into the main model, then sync permanent table specs in `.modscape/specs/`.

## Usage

```
@modscape-spec-archive <name>
@modscape-spec-archive <name> path/to/master.yaml
```

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
     > `changes/<name>/spec-model.yaml` not found. Run `@modscape-spec-design <name>` first.

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

3. **Check whether a main YAML exists (greenfield detection)**:

   Inspect `spec-config.yaml`:
   - If `main_yamls` is empty or absent, **or** all referenced files do not exist on disk → this is a **greenfield project**.

   **Greenfield path**: Skip Steps 1 and 2 entirely. Display:
   ```
   ## Greenfield Mode

   No main YAML found. spec-model.yaml will become the first model.
   Save as: model.yaml (default) — or enter a path:
   ```
   Wait for user input (press Enter to use `model.yaml`). Copy `spec-model.yaml` to the specified path:
   ```bash
   cp .modscape/changes/<name>/spec-model.yaml <output-path>
   ```
   Then proceed directly to Step 3, treating all tables as Direct Impact.

   **Normal path** (main YAML exists): continue below.

4. Build and display the merge preview **before** executing any merge:
   - **Tables to add**: IDs in `spec-model.yaml` but not in the main YAML
   - **Tables to update**: IDs in both; list key field changes
   - **No changes**: Context Only tables

   Wait for user confirmation (y/N). If declined: stop with "Archive cancelled."

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

6. Check the merge output for duplicate table ID warnings and report them.

7. Run validate on each merged main YAML:
   ```bash
   modscape validate <master>.yaml
   ```

### Step 3: Sync permanent table specs

7. **Migrate old flat-file specs (if any)**:
   For each affected table, check whether `.modscape/specs/<table-id>.md` exists as a plain file (old format).
   If found, move it into the new directory format before proceeding:
   ```bash
   mkdir -p .modscape/specs/<table-id>
   mv .modscape/specs/<table-id>.md .modscape/specs/<table-id>/spec.md
   ```

8. **Full spec sync for Direct Impact and Downstream Impact — Implement tables**:

   For each table in **Direct Impact** or **Downstream Impact — Implement**:

   a. Check whether `.modscape/specs/<table-id>/spec.md` exists.
      - If **not**: create a new file using the format below (also create the directory).
      - If **exists**: update only the relevant sections (Overview, Business Context, Business Rules, Known Issues); preserve unrelated content.

   b. Append a Changelog entry:
      ```
      - <YYYY-MM-DD>: <brief description of change> (SDD: <name>)
      ```

9. **Changelog only for Downstream Impact — Context Only tables**:
   - Do **not** perform a full spec sync for these tables.
   - Only append a Changelog entry to `.modscape/specs/<table-id>/spec.md` (create file and directory with minimal content if absent):
     - Append: `- <YYYY-MM-DD>: Referenced in downstream lineage; no structural change required (SDD: <name>)`

### Step 4: Sync questions per table

10. If `.modscape/changes/<name>/questions.md` exists:

    For each `### <table-id>` section under `## Table-level` in `changes/<name>/questions.md`:

    - Read the existing `.modscape/specs/<table-id>/questions.md` (create if absent with `# Questions: <table-id>\n`)
    - Append new questions that do not already exist (compare by question text, not ID)
    - Update answered (`[x]`) questions in the per-table file if unresolved entries exist
    - Mark invalidated questions with strikethrough: `~~- [ ] **Q-NNN** ...~~ <!-- <name>: <reason> -->`
    - Append `<!-- <name> -->` comment after each newly added question line

    **`## Pipeline-level` questions are NOT synced to `specs/`.** They remain in the archive folder only.
    Significant pipeline-level decisions may be recorded in `_context.yaml` under `decisions`.

### Step 5: Update `_context.yaml`

11. Read or create `.modscape/specs/_context.yaml`.

    For each affected table (Direct Impact + Downstream Impact — Implement):
    - Set `tables.<table-id>.last_change: <name>`
    - Set `tables.<table-id>.has_spec: true`
    - Set `tables.<table-id>.open_questions: <count of [ ] entries in specs/<table-id>/questions.md>`

    For significant pipeline-level decisions (answered questions with cross-table impact):
    - Append to `decisions` list:
      ```yaml
      - id: D-NNN
        summary: "<one-line summary>"
        date: <YYYY-MM-DD>
        affects: [<table-id>, ...]
        change: <name>
      ```

    Do NOT copy `description`, `kind`, or `tags` from `model.yaml`.

### Step 6: Move to archives

12. Move the work folder to `.modscape/archives/YYYY-MM-DD-<name>/` (today's date):
    ```bash
    mkdir -p .modscape/archives
    mv .modscape/changes/<name> .modscape/archives/YYYY-MM-DD-<name>
    ```

13. **Always output the following summary at the end, without exception:**

---
✅ Archive complete.

**Synced specs:**
- Created: `specs/<table-id>/spec.md` ...
- Updated: `specs/<table-id>/spec.md` ...
- Changelog only: `specs/<table-id>/spec.md` ...

**Questions synced:**
- `specs/<table-id>/questions.md` updated (<n> questions added/updated) ...
- Pipeline-level questions: kept in archive only

**`_context.yaml` updated:** <n> tables

**Spec coverage:** <n>/<total> tables have permanent specs.
Tables without specs: <list or "none">

**AC Coverage:** *(omit if no AC-NNN in spec.md)*
- ✅ Test covered: AC-001, AC-003 (<n> items)
- 🔧 Manual verification: AC-002 (<n> items)
- ❌ Uncovered: AC-005 (<n> items)

🎉 All work for this spec is complete!
---

## `specs/<table-id>/spec.md` Format

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
- <YYYY-MM-DD>: Initial version (SDD: <name>)
```
