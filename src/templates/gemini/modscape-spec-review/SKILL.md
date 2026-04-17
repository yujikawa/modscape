---
name: modscape-spec-review
description: Show a review summary of the current spec — open questions, assumptions, AC coverage, and downstream classification confidence — to support go/no-go decisions before implementation.
---

# Spec Review

Show a review summary of the current spec work folder to support go/no-go decisions before implementation.

## Usage

```
@modscape-spec-review <name>
```

## Instructions

1. Check that `.modscape/changes/<name>/` exists. If not, report the error.

2. Read (skip silently if missing):
   - `.modscape/changes/<name>/spec.md` — AC-NNN entries
   - `.modscape/changes/<name>/questions.md` — open questions
   - `.modscape/changes/<name>/design.md` — assumptions, low-confidence downstream notes
   - `.modscape/changes/<name>/tasks.md` — Phase 4 tests with `[→ AC-NNN]` / `[手動検証]`

3. Build and display the review summary:

   **Unresolved Questions**: count `- [ ]` lines in questions.md, list Q-NNN IDs

   **Assumptions**: find `**仮定:**` / `**Assumption:**` lines, list briefly

   **AC Coverage**: for each `AC-NNN:` in spec.md:
   - ✅ Test covered — Phase 4 task has `[→ AC-NNN]`
   - 🔧 Manual verification — `[手動検証]` marker or non-automatable condition
   - ❌ Uncovered — no reference in tasks.md

   **Downstream Classification (Low Confidence)**: tables with "分類確度が低い" or "confidence is low" in design.md

4. If no issues found: `✅ No open issues. Ready to implement.`
   Otherwise: `⚠️ 上記の問題を確認してから実装に進んでください。`

5. Always show next steps:
   ```
   @modscape-spec-implement <name>
   @modscape-spec-review <name>
   ```
