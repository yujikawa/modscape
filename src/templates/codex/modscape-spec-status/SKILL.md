---
name: modscape-spec-status
description: Show the current status of a spec work folder — phase, file checklist, task progress, and next recommended command. Optionally show a detailed view for handoff or onboarding.
---

# Spec Status

Show the current status of a spec work folder.

## Usage

```
/modscape:spec:status <name>
/modscape:spec:status <name> detail
```

## Instructions

**When reading model information, always use modscape CLI commands — do not use `grep` or direct file reads unless the information is genuinely unavailable from CLI:**
```bash
modscape table list <file>
modscape summary <file> --json
```

1. Check that `.modscape/changes/<name>/` exists.
   - If not: tell the user:
     > `changes/<name>/` not found. Run `/modscape:spec:requirements` to start a new spec.

1.5. **Detect output format** — read `.modscape/modscape-spec.config.yaml` and check the `output_format` key:
   - `output_format: html` → check for `.html` extensions (`spec.html`, `design.html`, `tasks.html`). All subsequent references to `spec.md` / `design.md` / `tasks.md` mean their `.html` counterparts.
   - Default → use `.md` as documented below.

2. Check which files exist in `.modscape/changes/<name>/`:
   - `spec.md` (or `spec.html`)
   - `spec-config.yaml`
   - `spec-model.yaml`
   - `design.md` (or `design.html`)
   - `tasks.md` (or `tasks.html`)

3. Determine the current phase based on what exists and task progress:
   - No `spec.md` → `not started`
   - `spec.md` only → `requirements`
   - `spec-model.yaml` + `design.md` + `tasks.md` exist → check tasks
     - Any `- [ ]` remaining (or `<li class="task-item incomplete">` in HTML) → `implement`
     - All complete → `ready to archive`

4. If `tasks.md` (or `tasks.html`) exists, count tasks:
   - Total tasks: count all `- [ ]` and `- [x]` lines (or task items in HTML)
   - Completed: count `- [x]` lines (or checked items in HTML)
   - Remaining: count `- [ ]` lines
   - Break down by Phase section

5. If `design.md` (or `design.html`) exists, check `## Findings > ### Requires Model Change`:
   - If it has entries: flag as ⚠️ model changes pending

6. Check for `session.md`:
   - If `.modscape/changes/<name>/session.md` exists, read it and extract the date, 決定済み事項, 未解決事項, 次のアクション sections.

7. Determine the **next action** using the following priority rules (use the first that applies):
   - `design.md` has entries under `## Findings > ### Requires Model Change` → `/modscape:spec:amend <name>`
   - `_questions.yaml` has entries with `status: open` or `status: assumed` for `change: <name>` → `/modscape:spec:answer <name>` (include count)
   - No `spec.md` (or `spec.html`) → `/modscape:spec:requirements`
   - No `design.md` (or `design.html`) → `/modscape:spec:design <name>`
   - No `tasks.md` (or `tasks.html`) → `/modscape:spec:tasks <name>`
   - Incomplete tasks remain → `/modscape:spec:implement <name>`
   - All tasks complete → `/modscape:spec:check <name>` (then `/modscape:spec:archive <name>`)

8. **Always output the following status block:**

---
📋 Spec: `<name>`

**Phase:** <requirements | design | implement | ready to archive>

**Files:**
  <✓ or ✗> spec.md (or spec.html)
  <✓ or ✗> spec-config.yaml
  <✓ or ✗> spec-model.yaml
  <✓ or ✗> design.md (or design.html)
  <✓ or ✗> tasks.md (or tasks.html)

**Tasks:** <n>/<total> complete
  <✓ or ○> Phase 1: Staging   (<done>/<total>)
  <✓ or ○> Phase 2: Core      (<done>/<total>)
  <✓ or ○> Phase 3: Mart      (<done>/<total>)
  <✓ or ○> Phase 4: Tests     (<done>/<total>)

<If session.md exists, append:>
📝 **前回のセッション** (<date from session.md>)
  決定済み: <bullet list from 決定済み事項, or "(なし)">
  未解決:   <bullet list from 未解決事項, or "(なし)">
  次のアクション: <one line from 次のアクション>

<If Requires Model Change entries exist:>
⚠️  Unresolved model changes in `design.md → ## Findings → Requires Model Change`

👉 **次にやること:**
```
<next action command from priority rules above>
```
<If unresolved questions exist, append: "  ⚠️ 未回答の質問が <n> 件あります — 実装前に `/modscape:spec:answer <name>` を推奨">
---

## Next command by phase

| Priority | Condition | Next command |
|---|---|---|
| 1 | Findings (Requires Model Change) | `/modscape:spec:amend <name>` |
| 2 | Unresolved questions in `_questions.yaml` | `/modscape:spec:answer <name>` |
| 3 | No spec.md / spec.html | `/modscape:spec:requirements` |
| 4 | No design.md / design.html | `/modscape:spec:design <name>` |
| 5 | No tasks.md / tasks.html | `/modscape:spec:tasks <name>` |
| 6 | Incomplete tasks | `/modscape:spec:implement <name>` |
| 7 | All tasks complete | `/modscape:spec:check <name>` → `/modscape:spec:archive <name>` |

---

## `detail` subcommand

When invoked as `/modscape:spec:status <name> detail`, run the standard status check first (steps 1–6 above), then append the following detail section.

### Detail instructions

Read the following files if they exist (use `.html` extension if `output_format: html`):

**From `spec.md` (or `spec.html`):**
- Extract the **Why** section (background / motivation) — summarize in 2–3 sentences
- Extract the **What Changes** section — list as bullets

**From `design.md` (or `design.html`):**
- Extract the **Decisions** section — list each decision title and chosen approach in one line
- Extract the **Non-Goals** section — list as bullets

**From `tasks.md` (or `tasks.html`):**
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
⚠️  Unresolved model changes in `design.md (or design.html) → Findings → Requires Model Change`. Run `/modscape:spec:design <name>` before implementing.
---

## COMMAND: /modscape:spec:status
