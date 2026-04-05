Implement pending tasks from `.modscape/sdd/tasks.md` one by one.

## Instructions

1. Read `.modscape/codegen-rules.md` to understand how to generate implementation code.
   If `.modscape/sdd/sdd.custom.md` exists, read it too — its rules take **priority** for target tool and output format.

2. Check that `.modscape/sdd/tasks.md` exists.
   - If it does not exist: stop and tell the user:
     > `tasks.md` not found. Run `/modscape:sdd:tasks` first to generate the task list.

3. Check for pending tasks (`- [ ]`).
   - If all tasks are complete (`- [x]`): tell the user:
     > All tasks are already complete. Update the `Status` field in `.modscape/sdd/spec.md` to `done`.
   - Otherwise: find the first pending task and proceed.

4. For each pending task, in phase order:

   **Staging / Core / Mart tasks:**
   - Read the corresponding table definition from `model.yaml`
   - Generate implementation code for the target tool (dbt, SQLMesh, etc.)
   - Follow the dependency order defined in `lineage` — always generate upstream tables first
   - Place generated files in the appropriate location (e.g., `models/staging/`, `models/core/`, `models/mart/`)

   **Test tasks:**
   - Generate test definitions for primary keys (unique + not_null) and foreign key relationships
   - For dbt: write to `models/schema.yml` or the appropriate schema file

5. After generating code for a task, immediately update the checkbox in `.modscape/sdd/tasks.md`:
   `- [ ]` → `- [x]`

6. After each task, confirm with the user before proceeding:
   > Task complete. Ready to move on to the next task?

## Code Generation Guidelines

- Follow `implementation.*` fields in `model.yaml` when present; fall back to `appearance.type` defaults
- Use `{{ ref('table_id') }}` (dbt) or equivalent for upstream references derived from `lineage`
- Add `-- TODO:` comments where `model.yaml` lacks sufficient information to generate definitive code
- Keep generated code minimal and correct — do not add logic not supported by the YAML

## Usage

```
/modscape:sdd:implement
/modscape:sdd:implement path/to/model.yaml
```

## Completion

When all tasks are done:

> All tasks complete! Update the `Status` field in `.modscape/sdd/spec.md` to `done`.
> Run `modscape dev model.yaml` to review the final model in the visualizer.
