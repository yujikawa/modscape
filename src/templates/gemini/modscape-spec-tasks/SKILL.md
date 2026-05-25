---
name: modscape-spec-tasks
description: Generate an implementation task list from spec-model.yaml.
---

# Pipeline Task Generation

Generate an implementation task list from `spec-model.yaml` and write it to `.modscape/changes/<name>/tasks.md`.

## Usage

```
@modscape-spec-tasks <name>
@modscape-spec-tasks <name> path/to/spec-model.yaml
```

## Instructions

0. **Resolve `<name>`** — if the user did not provide a spec name argument:
   ```bash
   modscape spec list
   ```
   - No specs: stop and tell the user to run `modscape spec new <name>` first.
   - Exactly one spec: use it automatically and note "Using spec: `<name>`".
   - Multiple specs: show the list and ask the user to choose one.

1. If `.modscape/modscape-spec.custom.md` exists, read it — its rules take **priority** over all defaults, including phase structure, additional tasks, and **communication preferences** (language, response format, etc.). Apply every rule in the file.

2. Read `.modscape/changes/<name>/spec-model.yaml` (default path) or the path provided by the user.

3. **Build the Context Only skip list** from `design.md`:
   - If `.modscape/changes/<name>/design.md` exists: read it and extract all table IDs listed under `### Downstream Impact — Context Only` into a skip list.
   - If `design.md` does not exist or has no such section: the skip list is empty — all tables are treated as implementation targets.

4. Check that `lineage` is defined.
   - If `lineage` is missing or empty: stop and tell the user:
     > No `lineage` entries found in `spec-model.yaml`. Run `@modscape-spec-design` to add lineage before generating tasks.

5. Build a dependency graph from `lineage` entries (`from` → `to`), then topologically sort all tables.

6. Assign each table to a phase based on its depth in the dependency graph. **Skip any table in the Context Only skip list** — do not assign it to any phase:
   - **Phase 1 — Staging**: tables with no upstream dependencies (leaf sources)
   - **Phase 2 — Core**: tables that depend only on Phase 1 tables (facts, dimensions, hubs, links, satellites)
   - **Phase 3 — Mart**: tables furthest downstream (mart type, or aggregated outputs)
   - **Phase 4 — Tests**: one test task per table (not in skip list) that has a primary key column or foreign key column

   For each task, include:
   - Table ID in backticks
   - Materialization type in brackets (from `physical.strategy` or inferred from `conceptual.kind`)
   - Upstream dependencies with `←` notation (omit for Phase 1)

7. **Write `.modscape/changes/<name>/tasks.md`** — behavior depends on the current state of the file:

   - **`tasks.md` does not exist** → generate fresh following the format.
   - **`tasks.md` exists and has 0 completed tasks (`- [x]`)** → overwrite and regenerate.
   - **`tasks.md` exists and has 1 or more completed tasks (`- [x]`)** → perform a merge:
     1. Present the diff (additions, keeps, removals) to the user and confirm before executing the merge.
     2. Merge rules: existing `[x]` tasks present in the new `spec-model.yaml` → keep `[x]`. New tables → add as `[ ]`. Removed tables → delete from tasks.md.

8. Update `Status` in `.modscape/changes/<name>/spec.md` from `design` to `tasks` (if spec.md exists).

## tasks.md Format

The format template is defined in `.modscape/formats/tasks-format.md`.
Read that file before writing `tasks.md` and use it as the template.

Omit the `## Context Only (Skipped)` section entirely if the skip list is empty.

## Next Step

After generating `tasks.md`, guide the user:

---
✅ `tasks.md` has been generated.

**Next step:**
```
@modscape-spec-implement <name>
```
---
