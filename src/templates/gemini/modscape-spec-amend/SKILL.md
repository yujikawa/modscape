---
name: modscape-spec-amend
description: Update SDD artifacts based on issues or discoveries found during implementation. Can be called at any point in the workflow, as many times as needed.
---

# Spec Amend

Update SDD artifacts based on issues or discoveries found during implementation.

## Usage

```
@modscape-spec-amend <name>
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
     > `changes/<name>/` not found. Run `@modscape-spec-requirements` to start a new spec.

2. Read the following files to understand current state:
   - `.modscape/changes/<name>/spec.md`
   - `.modscape/changes/<name>/design.md`
   - `.modscape/changes/<name>/tasks.md`
   - `.modscape/specs/_questions.yaml` (filter by `change: <name>`)
   - `.modscape/changes/<name>/spec-model.yaml` (if it exists)

4. Analyze the user's input and classify the finding:

   **判断基準 — 軽微な修正 vs 設計変更:**
   - **軽微な修正**: 列の型・制約・名前・説明の変更、AC の文言修正、JOIN キーの修正。`spec-model.yaml` の構造（テーブル数・lineage・relationships）は変わらない。
   - **設計変更**: テーブルの追加・削除、lineage の変更、grain の変更、`spec-model.yaml` の構造に影響する変更。

   | Input type | Target artifacts |
   |---|---|
   | Error message, column name mismatch, wrong data type | `spec.md` (fix related AC) + `spec-model.yaml` (fix column) + `tasks.md` (add fix task) |
   | Wrong JOIN key, broken design assumption, schema difference | `design.md` (fix the relevant section) + `tasks.md` (add fix task) |
   | Model structural change (table add/remove, lineage change, grain change) | User confirmation required → `design.md` Findings + `@modscape-spec-design` re-run guidance |
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

7. **Update `spec-model.yaml`** if the finding is a **軽微な修正**:
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

   If the finding is a **設計変更**:
   - Do NOT modify `spec-model.yaml` yet.
   - Add the finding to `design.md` under `## Findings > ### Requires Model Change`.
   - Ask the user to confirm, then output:
     > ⚠ これは設計変更を伴います。`design.md` の `### Requires Model Change` に記録しました。
     > `@modscape-spec-design <name>` を再実行して設計を更新してください。

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
   **Classification:** 軽微な修正 / 設計変更

   **Files updated:**
   - `spec.md`: AC-003 corrected — "amount_jpy" → "amount"
   - `tasks.md`: Added Amend: 2026-04-17 with 1 fix task
   ```

   Then output the ripple-effect report:

   ```
   ## 波及確認レポート

   | ファイル | 状態 | 内容 |
   |---|---|---|
   | spec.md | ✅ 影響なし / ✅ 更新済み / ⚠️ 要確認 | <変更内容または確認が必要な理由> |
   | design.md | ✅ 影響なし / ✅ 更新済み / ⚠️ 要確認 | <変更内容または確認が必要な理由> |
   | spec-model.yaml | ✅ 影響なし / ✅ 更新済み / ⏸ 保留（設計変更のため design 再実行が必要） | <変更内容> |
   ```

   Then output the following next-step guidance:

   ---
   **Next step:**
   - Continue implementing: `@modscape-spec-implement <name>`
   - Re-check open issues: `@modscape-spec-review <name>`
   - If design change flagged: `@modscape-spec-design <name>`

   🔖 To pause and resume later, run `@modscape-spec-save <name>`.
   ---
