---
name: modscape-spec-archive
description: Merge the work-scoped YAML back into the main model, sync permanent table specs, and move the work folder to archives.
---

# Spec Archive

Merge the work-scoped YAML back into the main model, then sync permanent table specs in `.modscape/specs`.

## Instructions

0. **Resolve `<name>`** — if the user did not provide a spec name argument:
   ```bash
   modscape spec list
   ```
   - No specs: stop and tell the user to run `modscape spec new <name>` first.
   - Exactly one spec: use it automatically and note "Using spec: `<name>`".
   - Multiple specs: show the list and ask the user to choose one.

**When reading model information, always use modscape CLI commands — do not use `grep` or direct file reads unless the information is genuinely unavailable from CLI:**
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

2.5. **Resolve model slug (`MODEL_SLUG`)** — used to determine the subdirectory within `.modscape/specs`:

   Per-table permanent specs are stored at `.modscape/specs/<MODEL_SLUG>/<table-id>.md`.

   **Normal path** (main YAML exists): for each main YAML path in `spec-config.yaml`, derive the slug with `path.parse(filePath).name`.
   - Example: `models/main-model1.yaml` → `MODEL_SLUG = main-model1`
   - If multiple main YAMLs exist, use the slug of each respective YAML when writing specs for its tables.

   **Greenfield path**: derive slug from the output path the user specified in step 3 below.
   - Example: user chooses `analytics/model.yaml` → `MODEL_SLUG = model`

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

7.5. **Coverage gate** (only when `modscape-spec.custom.md` has a `## Coverage Policy` section):
   - Read `.modscape/modscape-spec.custom.md` and extract the minimum coverage value (pattern: `Minimum documentation coverage: <N>%`)
   - If found, run: `modscape coverage .modscape/changes/<name>/spec-model.yaml`
   - If overall coverage is below the threshold, prompt: `⚠ Coverage: <actual>% < <threshold>% (threshold). Proceed anyway? (y/N)`
   - If `N`: display `Archive cancelled.` and stop without modifying main YAML
   - If `y` or threshold met: continue to Step 3
   - If no Coverage Policy: skip this step entirely

### Step 3: Sync permanent table specs

8. **Full spec sync for Direct Impact and Downstream Impact — Implement tables**:

   For each table in **Direct Impact** or **Downstream Impact — Implement**:

   Determine the output path: `.modscape/specs/<MODEL_SLUG>/<table-id>.md`

   a. Check whether the target file exists.
      - If **not**: create a new file using the format below.
      - If **exists**: update only the relevant sections (Overview, Business Context, Business Rules, Known Issues); preserve unrelated content.

   b. Append a Changelog entry:
      ```
      - <YYYY-MM-DD>: <brief description of change> (SDD: <name>)
      ```

9. **Changelog only for Downstream Impact — Context Only tables**:
   - Do **not** perform a full spec sync for these tables.
   - Only append a Changelog entry to `.modscape/specs/<MODEL_SLUG>/<table-id>.md` (create with minimal content if absent):
     - Append: `- <YYYY-MM-DD>: Referenced in downstream lineage; no structural change required (SDD: <name>)`

### Step 4: Merge questions into _questions.yaml

10. If `.modscape/changes/<name>/questions.md` exists:

    Read `.modscape/changes/<name>/questions.md` as a YAML list and `.modscape/specs/_questions.yaml`.

    For each entry in `questions.md`:
    - Check if the same Q-NNN ID already exists in `_questions.yaml` (skip if duplicate)
    - Append the entry to `_questions.yaml` as-is (all fields are already present: `id`, `question`, `status`, `answer`, `assumption`, `table`, `date`, `change`)

    After merging, delete `.modscape/changes/<name>/questions.md`.

    **If `questions.md` does not exist:** skip this step entirely.

### Step 4.5: Merge glossary into _glossary.yaml

If `.modscape/changes/<name>/glossary.md` exists:

    Read `.modscape/changes/<name>/glossary.md` and `.modscape/specs/_glossary.yaml` (create `_glossary.yaml` if it does not exist).

    **For each term entry in `glossary.md`:**
    - Parse: `id`, `definition`, and optional fields (`label`, `tables`, `columns`)
    - Check if the `id` already exists in `_glossary.yaml`:
      - **Not registered** → append a new entry under `terms:` with `change: <name>`
      - **Already registered** → update `change` field only; do NOT overwrite `definition` (preserve manual edits)

    After merging all entries, delete `glossary.md`:
    ```bash
    rm .modscape/changes/<name>/glossary.md
    ```

    **If `glossary.md` does not exist:** skip this step entirely.

### Step 5: Update `_context.yaml`

11. Read or create `.modscape/specs/_context.yaml`.

    `_context.yaml` stores only **cross-project architectural decisions** — NOT Q&A (those are in `_questions.yaml`).

    For significant cross-project decisions surfaced during this change:
    - Append to `decisions` list:
      ```yaml
      - id: D-NNN
        summary: "<one-line summary>"
        rationale: "<why this decision was made>"  # optional
        date: <YYYY-MM-DD>
        change: <name>
      ```

    Do NOT write `questions`, `tables.*`, or any schema fields to `_context.yaml`.

### Step 5.5: Extract and record project conventions

Review `design.md`, `spec.md`, and the decisions recorded in `_context.yaml` during this change for any **project-wide conventions** that were established or confirmed.

**Decision axis — which file to update:**
- `rules.custom.md`: rules about the **data model** (YAML shape, naming of table/column IDs, required columns, allowed table kinds, domain structure, SCD policy). These rules apply regardless of the implementation tool.
- `modscape-spec.custom.md`: rules about the **SDD workflow and code generation** (target tool, output directories, tasks.md format additions, code style, main YAML paths). These rules are tool- or process-specific.

**Quick test:** "Would this rule need to change if we switched implementation tools (e.g., dbt → SQLMesh)?"
- Yes → `modscape-spec.custom.md`
- No → `rules.custom.md`

If any conventions are found, present them to the user:

> The following conventions may have been established in this change:
>
> **Data model rules** (candidate for `rules.custom.md`):
> - \<candidate\>
>
> **Workflow / code generation rules** (candidate for `modscape-spec.custom.md`):
> - \<candidate\>
>
> Add any of these to the project convention files? (y/N)

If confirmed:
- Create the target file if it does not exist.
- Append the new rules under an appropriate section heading.
- Avoid duplicating rules already present in the file.

If no conventions are found, or the user declines: skip this step silently.

### Step 6: Move to archives

12. Move the work folder to `.modscape/archives/YYYY-MM-DD-<name>/` (today's date):
    ```bash
    mkdir -p .modscape/archives
    mv .modscape/changes/<name> .modscape/archives/YYYY-MM-DD-<name>
    ```

## COMMAND: /modscape:spec:archive

Usage: `/modscape:spec:archive <name> [path/to/master.yaml]`

**Always output the following summary at the end, without exception:**

---
✅ Archive complete.

**Synced specs:**
- Created: `specs/<MODEL_SLUG>/<table-id>.md` ...
- Updated: `specs/<MODEL_SLUG>/<table-id>.md` ...
- Changelog only: `specs/<MODEL_SLUG>/<table-id>.md` ...

**Questions merged:**
- `_questions.yaml`: <n> entries added from `questions.md` (or: no questions.md found)

**`_context.yaml` updated:** <n> decisions added

**Conventions recorded:**
- `rules.custom.md`: <n> rules added (or: none)
- `modscape-spec.custom.md`: <n> rules added (or: none)

**Spec coverage:** <n>/<total> tables have permanent specs.
Tables without specs: <list or "none">

**AC Coverage:** *(omit if no AC-NNN in spec.md)*
- ✅ Test covered: AC-001, AC-003 (<n> items)
- 🔧 Manual verification: AC-002 (<n> items)
- ❌ Uncovered: AC-005 (<n> items)

🎉 All work for this spec is complete!
---

## `specs/<MODEL_SLUG>/<table-id>.md` Format

```markdown
# <table-id>

## Overview
- **Owner**: <from spec stakeholders.owner>
- **Update Frequency**: <inferred from implementation or spec>
- **SLA**: <from spec if available, otherwise "—">
- **Grain**: <What does one row represent in business terms? e.g., "one completed order line">
- **Primary Consumers**: <teams or systems that use this table and for what purpose>

## Business Context
<!-- The most important section. Capture what only humans know: why this data exists,
     what business process generates it, and what it means in the context of operations. -->

### Data Occurrence Conditions
<What business event or action causes a row to be created? Who enters it, in what system, for what purpose?
 Source: spec.md ## Business Context → Data Occurrence Conditions, or ask the user.>

### Business Process Flow
<End-to-end business process that produces or consumes this table. What happens before this data is created? After?
 Source: spec.md ## Business Context → Business Process Flow>

### Domain Rules & Edge Cases
<!-- Things an engineer would get wrong without being told. Include status codes, magic values,
     known quirks, and the most common misunderstandings about this data. -->
- <Rule or quirk that is not derivable from the schema alone>
- <Any status codes, flags, or NULL semantics with business-specific meaning>
- <Common mistakes engineers make about this data>
<!-- Source: spec.md ## Business Context → Domain Rules, questions.md answered/assumed entries, design.md findings -->

## Business Rules
<!-- Explicit rules governing what data is included, how it is calculated, and what is excluded. -->
- **Inclusion criteria**: <which records are included>
- **Exclusion criteria**: <which records are filtered out and why>
- **Calculations**: <how key measures or derived columns are computed>
- **Special cases**: <exceptions to normal rules>
<!-- Source: spec.md ## Business Context → Domain Rules, questions.md, design.md Design Decisions -->

## Known Issues / Caveats
- <Data quality issues, known source defects, or technical gotchas>
<!-- Source: design.md ## Findings, questions.md status: assumed entries -->

## Usage Guide
<!-- For analysts and consumers of this table. Focus on what is NOT obvious from the schema. -->

### ⚠ Don't Do This
<!-- Patterns that cause incorrect results — double-counting, wrong JOINs, misused columns -->
- <e.g., Do not SUM(amount) without filtering cancelled rows — cancelled records remain in the table>
<!-- Source: design.md ## Findings, questions.md, Domain Rules & Edge Cases -->

### Required Filters
<!-- Filters that MUST be applied in every query against this table -->
- <e.g., Always filter `is_deleted = false`>
<!-- Source: spec.md ## Business Rules → Exclusion criteria, design.md Design Decisions -->

### Common JOIN Patterns
<!-- How to correctly join this table with others; note any SCD type 2 or fan-out risks -->
```sql
-- <describe what this join does>
FROM <table-id> t
JOIN <other-table> o ON t.<key> = o.<key>
  -- <any required join conditions, e.g., AND o.is_current = true>
```
<!-- Source: spec-model.yaml relationships, design.md Design Decisions -->

### Example Queries
```sql
-- <describe what this query does, e.g., monthly revenue summary>
SELECT ...
FROM <table-id>
WHERE ...
```
<!-- Source: spec.md goals, questions.md answered entries -->

## Changelog
- <YYYY-MM-DD>: Initial version (SDD: <name>)
```

**Population guidance for step 10** — source each section as follows:
- `Grain`: from `spec.md` goal/data sources, or from `conceptual.description` in `spec-model.yaml`
- `Data Occurrence Conditions`: from `spec.md ## Business Context → Data Occurrence Conditions`
- `Business Process Flow`: from `spec.md ## Business Context → Business Process Flow`
- `Domain Rules & Edge Cases`: from `spec.md ## Business Context → Domain Rules`, plus `questions.md` answered/assumed entries, plus `design.md ## Findings`
- `Business Rules`: from `spec.md ## Business Context → Domain Rules`, plus `design.md ## Design Decisions`
- `Known Issues`: from `design.md ## Findings → Implementation Notes` and `questions.md status: assumed`
- `Usage Guide — Don't Do This`: from `design.md ## Findings`, `questions.md` answered/assumed entries, and `Domain Rules & Edge Cases` — focus on patterns that produce wrong results
- `Usage Guide — Required Filters`: from `spec.md ## Business Rules → Exclusion criteria` and `design.md ## Design Decisions`
- `Usage Guide — Common JOIN Patterns`: from `spec-model.yaml` relationships and `design.md ## Design Decisions`
- `Usage Guide — Example Queries`: from `spec.md` goals and `questions.md` answered entries — write concrete SQL when enough context is available, otherwise leave a `<!-- TODO: fill in -->` placeholder

If any source is absent, leave the subsection with a `<!-- TODO: fill in -->` placeholder rather than omitting it.
