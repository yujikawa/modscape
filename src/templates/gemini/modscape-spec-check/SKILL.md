---
name: modscape-spec-check
description: Pre-implementation quality check combining cross-artifact consistency and go/no-go readiness.
---

Pre-implementation quality check combining cross-artifact consistency and go/no-go readiness.

## Usage

```
@modscape-spec-check <name>
```

## Instructions

1. Check that `.modscape/changes/<name>/` exists.
   - If not: stop and tell the user:
     > `changes/<name>/` not found. Run `@modscape-spec-requirements` to start a new spec.

2. Read the following files (skip silently if a file does not exist — note which were skipped):
   - `.modscape/changes/<name>/spec.md`
   - `.modscape/changes/<name>/design.md`
   - `.modscape/changes/<name>/tasks.md`
   - `.modscape/changes/<name>/questions.md`
   - `.modscape/changes/<name>/spec-model.yaml` — use `modscape table list` to get table IDs

---

### Part 1: Consistency

Run checks by category. For each category, if a required file is missing, display `⏭ skipped — <filename> not found` and move to the next category.

**A. spec.md ↔ design.md**

A-1. Table coverage
- Extract table IDs mentioned in `spec.md` (kebab-case identifiers matching table IDs in the model)
- Check that each ID appears in `design.md` under `## Affected Tables`
- Flag any table ID found in `spec.md` but absent from `design.md` Affected Tables

A-2. Requires Model Change tracking
- Extract entries listed under `### Requires Model Change` in `design.md`
- For each entry, check if a corresponding task exists in `tasks.md`
- Flag any entry with no corresponding task

**B. design.md ↔ spec-model.yaml**

B-1. Direct Impact tables exist in model
- Extract table IDs listed under `### Direct Impact` in `design.md`
- Check each ID against `modscape table list .modscape/changes/<name>/spec-model.yaml`
- Flag any ID listed as Direct Impact but absent from `spec-model.yaml`

B-2. Model tables are classified in design
- Get all table IDs from `modscape table list .modscape/changes/<name>/spec-model.yaml`
- Check each ID appears somewhere in `design.md` `## Affected Tables`
- Flag any table in `spec-model.yaml` that has no classification in `design.md`

**C. design.md ↔ tasks.md**

C-1. Direct Impact table task coverage
- Extract table IDs under `### Direct Impact` in `design.md`
- For each, check if at least one task in `tasks.md` references it
- Flag Direct Impact tables with no corresponding task

**D. questions.md ↔ design.md**

D-1. Unresolved questions recorded as assumptions
- **MD mode**: Find all `- [ ]` entries in `questions.md` (unresolved Q-NNN)
- **HTML mode**: Find all elements with `class="q-item"` where the class also contains `open` (i.e., `<div class="q-item open" ...>`) in `questions.html`; extract the Q-NNN from the `<span class="q-id ...">` inside each
- For each unresolved question, check if the corresponding design file contains a reference to that Q-NNN or topic as an assumption:
  - **MD mode**: look for `**Assumption:**` or `**仮定:**` lines in `design.md`
  - **HTML mode**: look for elements with `data-type="assumption"` in `design.html`, or paragraphs/divs containing the text "Assumption:" or "仮定:" as visible text
- Flag unresolved questions with no assumption recorded

---

### Part 2: Readiness

**Unresolved questions**
- **MD mode**: Count lines matching `- [ ]` in `questions.md`; list their Q-NNN IDs
- **HTML mode**: Count elements matching `<div class="q-item open"` in `questions.html`; extract Q-NNN from the `<span class="q-id">` inside each

**Assumptions**
- **MD mode**: Find lines containing `**仮定:**` or `**Assumption:**` in `design.md` and `questions.md`; count and list them briefly (first 60 chars of each line)
- **HTML mode**: Find elements with `data-type="assumption"` in `design.html` and `questions.html`, or any text node/element containing the string "Assumption:" or "仮定:" as rendered text; count and list them briefly

**AC Coverage** (requires both `spec.md` and `tasks.md`)
- **MD mode**: Extract all `AC-NNN:` entries from `spec.md` Acceptance Criteria
- **HTML mode**: Extract all `AC-NNN` identifiers from `<span class="ac-id">` elements in `spec.html`
- For each AC-NNN, check if any Phase 4 task in the tasks file contains `[→ AC-NNN]`:
  - **MD mode**: search for `[→ AC-NNN]` pattern in `tasks.md`
  - **HTML mode**: search for `[→ AC-NNN]` text within `.task-text` elements in `tasks.html`
- Classify each AC as:
  - **Test covered**: at least one Phase 4 task references it with `[→ AC-NNN]`
  - **Manual verification**: no test task, but `[manual verification]` appears near the AC in the tasks file, or the AC text describes a non-automatable condition
  - **Uncovered**: no reference found in tasks file at all
- If the spec or tasks file does not exist or has no AC-NNN entries: skip this section

**Downstream classification confidence**
- Scan `design.md` for tables marked with low confidence
- List those table IDs

**Documentation Coverage** (only when `modscape-spec.custom.md` has a `## Coverage Policy` section with a minimum threshold)
- Read `.modscape/modscape-spec.custom.md` and extract the minimum coverage value from `## Coverage Policy` (pattern: `Minimum documentation coverage: <N>%`)
- If found, run: `modscape coverage .modscape/changes/<name>/spec-model.yaml`
- Parse the output and display per-table coverage
- Flag tables below the threshold with ⚠️
- If `modscape-spec.custom.md` does not exist or has no Coverage Policy: skip this section entirely

---

3. Display the combined report:

```
## Check: <name>

### Part 1: Consistency

#### A. spec.md ↔ design.md
✅ All tables in spec.md are classified in design.md
❌ Requires Model Change "fct_orders: add column revenue_net" has no corresponding task in tasks.md
   → Add a task to tasks.md or re-run @modscape-spec-design <name>

#### B. design.md ↔ spec-model.yaml
✅ All Direct Impact tables exist in spec-model.yaml
⚠️  mart_summary: exists in spec-model.yaml but not classified in design.md Affected Tables
   → Re-run @modscape-spec-design <name> to classify this table

#### C. design.md ↔ tasks.md
⚠️  stg_orders: Direct Impact but no matching task found in tasks.md
   → Add a task or re-run @modscape-spec-design <name>

#### D. questions.md ↔ design.md
✅ All unresolved questions are recorded as assumptions in design.md

---

### Part 2: Readiness

#### Unresolved Questions
- 3 件 — Q-001, Q-003, Q-007 (see .modscape/changes/<name>/questions.md)

#### Assumptions
- 2 件
  - `fct_orders`: NULL rate assumed < 5% (unconfirmed)
  - ...

#### AC Coverage (4/6)
- ✅ AC-001: <text> ← Phase 4 test
- ✅ AC-003: <text> ← Phase 4 test
- 🔧 AC-002: <text> [manual verification]
- ❌ AC-004: <text> — no test generated
- ❌ AC-005: <text> — no test generated

#### Downstream Classification (Low Confidence)
- `dim_customer`: lineage only — Context Only (low confidence)
```

4. Evaluate overall status:
   - **Ready**: no ❌ consistency issues AND no unresolved questions AND no uncovered ACs AND no low-confidence downstream tables
     → Display: `✅ No issues found. Ready to implement.`
   - **Proceed with caution**: only ⚠️ warnings, or open questions/assumptions exist
     → Display: `⚠️ Issues found above. Review before implementing. You may still proceed if needed.`
   - **Blocker**: at least one ❌ consistency issue exists
     → Display: `🚫 Blocking issues found. Re-run @modscape-spec-design <name> before implementing.`

5. **Always output the following next steps at the end:**

---
**Next steps:**
```
@modscape-spec-design <name>    # re-run design to fix model/task gaps
@modscape-spec-implement <name> # proceed to implementation
@modscape-spec-check <name>     # re-run after making changes
```
---
