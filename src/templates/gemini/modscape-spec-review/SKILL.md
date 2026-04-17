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
   - `.modscape/changes/<name>/tasks.md` — Phase 4 tests with `[→ AC-NNN]` / `[manual verification]`

3. Build and display the review summary:

   **Unresolved Questions**: count `- [ ]` lines in questions.md, list Q-NNN IDs

   **Assumptions**: find `**Assumption:**` lines, list briefly

   **AC Coverage**: for each `AC-NNN:` in spec.md:
   - ✅ Test covered — Phase 4 task has `[→ AC-NNN]`
   - 🔧 Manual verification — `[manual verification]` marker or non-automatable condition
   - ❌ Uncovered — no reference in tasks.md

   **Downstream Classification (Low Confidence)**: tables with "confidence is low" or "classification confidence is low" in design.md

4. If no issues found: `✅ No open issues. Ready to implement.`
   Otherwise: `⚠️ Open issues found above. Please review before implementing. You may still proceed to implementation if needed.`

5. Always show next steps:
   ```
   @modscape-spec-implement <name>
   @modscape-spec-review <name>
   ```
