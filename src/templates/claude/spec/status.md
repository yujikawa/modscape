Show the current status of a spec work folder. Optionally show a detailed view for handoff or onboarding.

## Usage

```
/modscape:spec:status <name>
/modscape:spec:status <name> detail
```

## Instructions

0. **Detect language** — If `.modscape/modscape-spec.custom.md` exists, read it and look for a `## Communication` section. If it contains a language directive (e.g., "Always respond in Japanese"), use that language for all output in this session. Otherwise default to English.

1. **Resolve `<name>`** — if the user did not provide a spec name argument:
   ```bash
   modscape spec list
   ```
   - No specs: stop and tell the user to run `modscape spec new <name>` first.
   - Exactly one spec: use it automatically and note "Using spec: `<name>`".
   - Multiple specs: show the list and ask the user to choose one.

**When reading model information, always use modscape CLI commands — do not use `grep` or direct file reads unless the information is genuinely unavailable from CLI:**
```bash
modscape table list <file>
modscape summary <file> --json
```

2. Check that `.modscape/changes/<name>/` exists.
   - If not: tell the user:
     > `changes/<name>/` not found. Run `/modscape:spec:requirements` to start a new spec.

3. Check which files exist in `.modscape/changes/<name>/`:
   - `spec.md`
   - `spec-config.yaml`
   - `spec-model.yaml`
   - `design.md`
   - `tasks.md`

4. Determine the current phase based on what exists and task progress:
   - No `spec.md` → `not started`
   - `spec.md` only → `requirements`
   - `spec-model.yaml` + `design.md` + `tasks.md` exist → check tasks
     - Any `- [ ]` remaining → `implement`
     - All complete → `ready to archive`

5. If `tasks.md` exists, count tasks:
   - Total tasks: count all `- [ ]` and `- [x]` lines
   - Completed: count `- [x]` lines
   - Remaining: count `- [ ]` lines
   - Break down by Phase section

6. If `design.md` exists, check `## Findings > ### Requires Model Change`:
   - If it has entries: flag as ⚠️ model changes pending

7. Determine the **next action** using the following priority rules (use the first that applies):
   - `design.md` has entries under `## Findings > ### Requires Model Change` → `/modscape:spec:amend <name>`
   - `_questions.yaml` has entries with `status: open` or `status: assumed` for `change: <name>` → `/modscape:spec:answer <name>` (include count)
   - No `spec.md` → `/modscape:spec:requirements`
   - No `design.md` → `/modscape:spec:design <name>`
   - No `tasks.md` → `/modscape:spec:tasks <name>`
   - Incomplete tasks remain → `/modscape:spec:implement <name>`
   - All tasks complete → `/modscape:spec:check <name>` (then `/modscape:spec:archive <name>`)

9. **Always output the following status block:**

---
📋 Spec: `<name>`

**Phase:** <requirements | design | implement | ready to archive>

**Files:**
  <✓ or ✗> spec.md
  <✓ or ✗> spec-config.yaml
  <✓ or ✗> spec-model.yaml
  <✓ or ✗> design.md
  <✓ or ✗> tasks.md

**Tasks:** <n>/<total> complete
  <✓ or ○> Phase 1: Staging   (<done>/<total>)
  <✓ or ○> Phase 2: Core      (<done>/<total>)
  <✓ or ○> Phase 3: Mart      (<done>/<total>)
  <✓ or ○> Phase 4: Tests     (<done>/<total>)

<If Requires Model Change entries exist:>
⚠️  Unresolved model changes in `design.md → ## Findings → Requires Model Change`

👉 **Next step:**
```
<next action command from priority rules above>
```
<If unresolved questions exist, append: "  ⚠️ There are <n> unanswered questions — run `/modscape:spec:answer <name>` before implementation">
---

## Next command by phase

| Priority | Condition | Next command |
|---|---|---|
| 1 | Findings (Requires Model Change) | `/modscape:spec:amend <name>` |
| 2 | Unresolved questions in `_questions.yaml` | `/modscape:spec:answer <name>` |
| 3 | No spec.md | `/modscape:spec:requirements` |
| 4 | No design.md | `/modscape:spec:design <name>` |
| 5 | No tasks.md | `/modscape:spec:tasks <name>` |
| 6 | Incomplete tasks | `/modscape:spec:implement <name>` |
| 7 | All tasks complete | `/modscape:spec:check <name>` → `/modscape:spec:archive <name>` |

---

## `detail` subcommand

When invoked as `/modscape:spec:status <name> detail`, run the standard status check first (steps 1–7 above), then append the following detail section.

### Detail instructions

Read the following files if they exist:

**From `spec.md`:**
- Extract the **Why** section (background / motivation) — summarize in 2–3 sentences
- Extract the **What Changes** section — list as bullets

**From `design.md`:**
- Extract the **Decisions** section — list each decision title and chosen approach in one line
- Extract the **Non-Goals** section — list as bullets

**From `tasks.md`:**
- List all remaining incomplete tasks, grouped by Phase section

### Detail output block

Append the following after the standard status block:

---
📖 Detail: `<name>`

## Overview
<2–3 sentences from spec.md's Why section. If spec.md does not exist, write "No spec.md yet.">

## What Changes
<Bullet list from spec.md's What Changes section. Omit if not available.>

## Key Decisions
<One line per decision from design.md's Decisions section: "**Decision title**: chosen approach". Write "No design decisions recorded yet." if design.md does not exist or has no Decisions section.>

## Non-Goals
<Bullet list from design.md's Non-Goals. Omit if not present.>

## Remaining Tasks
<List all `- [ ]` lines from tasks.md, grouped under their Phase headings. Write "All tasks complete." if none remain.>

## Handoff Notes
**Next step:**
```
<the appropriate next command based on current phase>
```
<If any `- [ ]` tasks remain, add: "Pick up from the first remaining task above.">
<If design.md has entries under `## Findings > ### Requires Model Change`, add:>
⚠️  Unresolved model changes in `design.md → Findings → Requires Model Change`. Run `/modscape:spec:design <name>` before implementing.
---
