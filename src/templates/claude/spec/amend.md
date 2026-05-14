Update SDD artifacts based on issues or discoveries found during implementation. Can be called at any point in the workflow, as many times as needed.

## Usage

```
/modscape:spec:amend <name>
```

`<name>` is the work folder name (e.g., `monthly-sales-summary`).

After the command, describe the issue, error, or change in free text. For example:
- Paste an error message
- Describe a wrong assumption ("the JOIN key is `user_id`, not `customer_id`")
- Note an ambiguity ("I'm not sure if `updated_at` can be NULL — needs checking")

## Instructions

0. **Resolve `<name>`** — if the user did not provide a spec name argument:
   ```bash
   modscape spec list
   ```
   - No specs: stop and tell the user to run `modscape spec new <name>` first.
   - Exactly one spec: use it automatically and note "Using spec: `<name>`".
   - Multiple specs: show the list and ask the user to choose one.

1. Verify that `.modscape/changes/<name>/` exists.
   - If not: stop and tell the user:
     > `changes/<name>/` not found. Run `/modscape:spec:requirements` to start a new spec.

2. Read the following files to understand current state:
   - `.modscape/changes/<name>/spec.md`
   - `.modscape/changes/<name>/design.md`
   - `.modscape/changes/<name>/tasks.md`
   - `.modscape/specs/_questions.yaml` (filter by `change: <name>`)
   - `.modscape/changes/<name>/spec-model.yaml` (if it exists)

3. Analyze the user's input and classify the finding:

   **Decision criteria — Minor fix vs. Design change:**
   - **Minor fix**: Column type/constraint/name/description changes, AC wording fixes, JOIN key corrections. The structure of `spec-model.yaml` (table count, lineage, relationships) does not change.
   - **Design change**: Adding or removing tables, lineage changes, grain changes, any change that affects the structure of `spec-model.yaml`.

   | Input type | Target artifacts |
   |---|---|
   | Error message, column name mismatch, wrong data type | `spec.md` (fix related AC) + `spec-model.yaml` (fix column) + `tasks.md` (add fix task) |
   | Wrong JOIN key, broken design assumption, schema difference | `design.md` (fix the relevant section) + `tasks.md` (add fix task) |
   | Model structural change (table add/remove, lineage change, grain change) | User confirmation required → `design.md` Findings + `/modscape:spec:design` re-run guidance |
   | Unresolved question, "needs checking", ambiguity | `_questions.yaml` (add new Q-NNN) |
   | Multiple concerns in one input | All applicable files |

5. **Update `spec.md`** if the issue affects Acceptance Criteria:
   - Find the relevant `AC-NNN` entry
   - Correct it to reflect the actual behaviour or constraint
   - Do NOT renumber existing AC IDs

6. **Update `design.md`** if the issue affects a design decision:
   - Find the relevant section (Decisions, Risks, etc.)
   - Correct or extend it with the discovered information
   - Add a note such as: `> ⚠ Amended <YYYY-MM-DD>: <reason>`

7. **Update `spec-model.yaml`** if the finding is a **Minor fix**:
   - Apply changes using mutation CLI commands:
     ```bash
     modscape column update .modscape/changes/<name>/spec-model.yaml --table <id> --column <col-id> --type <new-type>
     # or direct YAML edit for nested fields not covered by CLI
     ```
   - Always run validate after any change:
     ```bash
     modscape validate .modscape/changes/<name>/spec-model.yaml
     ```
   - If validate fails: fix the error before proceeding.

   If the finding is a **Design change**:
   - Do NOT modify `spec-model.yaml` yet.
   - Add the finding to `design.md` under `## Findings > ### Requires Model Change`.
   - Ask the user to confirm, then output:
     > ⚠ This is a design change. Recorded in `design.md` under `### Requires Model Change`.
     > Re-run `/modscape:spec:design <name>` to update the design.

8. **Update `tasks.md`** if code changes are needed:
   - **Never modify `- [x]` completed tasks**
   - Append a new section at the end of the file:
     ```
     ## Amend: <YYYY-MM-DD>

     - [ ] A.1 <fix task description>
     - [ ] A.2 <fix task description>
     ```
   - If multiple amend runs occur on the same date, append to the existing `## Amend: <YYYY-MM-DD>` section.

9. **Update `questions.md`** if an unresolved question arises:
   - Read `.modscape/changes/<name>/questions.md` and find the current max Q-NNN; also check `_questions.yaml` to avoid global duplication
   - Check whether the question already exists (compare by text; skip if duplicate)
   - Append a new entry to `.modscape/changes/<name>/questions.md` (create if it does not exist):
     ```yaml
     - id: Q-NNN
       question: "<question text>"
       status: open         # or: assumed
       assumption: "<what you will assume to proceed>"   # only if status: assumed
       table: <table-id>    # optional
       date: <YYYY-MM-DD>
       change: <name>
     ```

10. **Display a change summary with ripple-effect report**:

   ```
   ## Amend Summary

   **Input interpreted as:** <one-line classification of the issue>
   **Classification:** Minor fix / Design change

   **Files updated:**
   - `spec.md`: AC-003 corrected — "amount_jpy" → "amount"
   - `tasks.md`: Added Amend: 2026-04-17 with 1 fix task
   ```

   Then output the ripple-effect report:

   ```
   ## Impact report

   | File | Status | Details |
   |---|---|---|
   | spec.md | ✅ No impact / ✅ Updated / ⚠️ Needs review | <change details or reason for review> |
   | design.md | ✅ No impact / ✅ Updated / ⚠️ Needs review | <change details or reason for review> |
   | spec-model.yaml | ✅ No impact / ✅ Updated / ⏸ On hold (re-run design first) | <change details> |
   ```

   Then output the following next-step guidance:

   ---
   **Next step:**
   - Continue implementing: `/modscape:spec:implement <name>`
   - Re-check open issues: `/modscape:spec:review <name>`
   - If design change flagged: `/modscape:spec:design <name>`

   💾 To save session state before ending, run `/modscape:spec:save <name>`. To resume in a new session, run `/modscape:spec:load <name>`.
   ---
