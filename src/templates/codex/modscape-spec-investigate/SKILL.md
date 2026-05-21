---
name: modscape-spec-investigate
description: Investigate a topic by reading repository files and record findings in design.md.
---

# Spec Investigate

Investigate a topic by reading repository files and record findings in `design.md`.

## Usage

```
/modscape:spec:investigate [<name>]
```

## Instructions

### Step 0 — Detect language

If `.modscape/modscape-spec.custom.md` exists, read it and check for a `## Communication` language directive. Apply it. Otherwise default to English.

### Step 1 — Resolve the change name

Resolve `<name>` from argument or auto-detect (single active change). If multiple exist, ask the user to specify.

### Step 2 — Receive the investigation request

Ask the user what to investigate (free-text). If the target files or tables are unclear, ask one clarifying question before proceeding.

### Step 3 — Identify and read relevant files

Read only the files directly relevant to the request. Prioritize:
1. `.modscape/changes/<name>/spec-model.yaml`
2. `.modscape/changes/<name>/design.md`
3. `.modscape/changes/<name>/spec.md`
4. `.modscape/specs/<table-id>/spec.md` for referenced tables
5. SQL / dbt model files matching the request
6. Main `model.yaml` if needed

### Step 4 — Investigate and summarize

Analyze the files. Produce a finding summary:

```
## 🔍 Investigation Result

**Request:** <brief summary>
**Files read:** <list>

**Finding:**
<specific findings — column names, logic differences, line references>

**Impact:**
<impact on design / implementation / spec>

**Recommended action:** <no action needed / implement inline fix / re-run design / update spec.md AC>
```

### Step 5 — Write to design.md

Append to `.modscape/changes/<name>/design.md` under `## Findings` (create section if absent):

```markdown
### Finding: <title> (<YYYY-MM-DD>)
**調査依頼:** <one-line summary>
**調査対象:** <files read>
**発見:** <what was found>
**影響:** <impact>
**次のアクション:** <recommended action>
```

### Step 6 — Guide next action

| Finding | Next step |
|---|---|
| Logic error in implemented files | `/modscape:spec:implement <name>` (inline fix protocol) |
| Model structure change needed | `/modscape:spec:design <name>` |
| AC contradiction | Update spec.md AC-NNN, then `/modscape:spec:implement <name>` |
| Reference only | `Finding recorded. No changes required.` |

## COMMAND: /modscape:spec:investigate
