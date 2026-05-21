---
name: modscape-spec-check
description: Pre-implementation quality check with SSOT-driven consistency and go/no-go readiness.
---

# Spec Check

Pre-implementation quality check: SSOT-driven consistency + go/no-go readiness.

## Usage

```
/modscape:spec:check <name> [--from <artifact>]
```

- `<artifact>`: `spec-model.yaml` (default), `design.md`, or `spec.md`

## Instructions

### Step 0 — Detect language

If `.modscape/modscape-spec.custom.md` exists, read it and look for a `## Communication` section. If it contains a language directive, use that language. Otherwise default to English.

### Step 1 — Resolve the change name and SSOT

Resolve `<name>` from argument or auto-detect (single active change). Resolve SSOT from `--from` (default: `spec-model.yaml`).

Read the following files (skip silently if missing, note which were skipped):
- `.modscape/changes/<name>/spec.md`
- `.modscape/changes/<name>/design.md`
- `.modscape/changes/<name>/tasks.md`
- `.modscape/changes/<name>/questions.md`
- `.modscape/changes/<name>/spec-model.yaml` (use `modscape table list` for table IDs)

### Step 2 — Part 1: SSOT-driven Consistency

Run checks based on the chosen SSOT. For each issue, include a **→ Fix:** line.

**When SSOT = `spec-model.yaml` (default):**
- A. Check all spec-model.yaml tables are classified in design.md Affected Tables (❌ if missing → re-run `/modscape:spec:design`)
- B. Check all Direct Impact tables have at least one task in tasks.md (❌ if missing → re-run `/modscape:spec:tasks`)
- C. Check unresolved Q-NNN questions have an Assumption block in design.md (⚠️ if missing → run `/modscape:spec:answer`)

**When SSOT = `design.md`:**
- A. Check all tables in design.md Implementation Details exist in spec-model.yaml (❌ if absent → fix design.md or add to model)
- B. Check all Direct Impact tables have tasks (❌ if missing → re-run `/modscape:spec:tasks`)
- C. Check all spec.md ACs are referenced in design.md (⚠️ if not found → update design.md)

**When SSOT = `spec.md`:**
- A. Check all spec.md ACs are mentioned in design.md (❌ if absent → update design.md)
- B. Classify each AC: ✅ Phase 4 test covers it / 🔧 manual verification / ❌ uncovered (→ add task or mark manual)

### Step 3 — Part 2: Readiness (always run)

- **Unresolved questions**: count and list open/assumed Q-NNN entries
- **Assumptions**: count Assumption blocks in questions.md and design.md
- **AC Coverage**: classify each AC-NNN (if not already done in Part 1)
- **Documentation Coverage**: run `modscape coverage` if Coverage Policy is set in modscape-spec.custom.md; skip otherwise

### Step 4 — Display report and verdict

```
## Check: <name>  (SSOT: <artifact>)

### Part 1: Consistency
#### A. <title>
✅ / ❌ <finding>
   → Fix: <what to do>

---
### Part 2: Readiness
#### Unresolved Questions
#### Assumptions
#### AC Coverage
#### Documentation Coverage
```

**Verdict:**
- `✅ No issues found. Ready to implement.` — no ❌, no uncovered ACs, no unresolved questions
- `⚠️ Issues found above. Review before implementing.` — warnings only
- `🚫 Blocking issues found. Fix inconsistencies before implementing.` — any ❌

**Next steps (always show):**
```
/modscape:spec:design <name>
/modscape:spec:implement <name>
/modscape:spec:check <name> --from design.md
/modscape:spec:check <name> --from spec.md
```

## COMMAND: /modscape:spec:check
