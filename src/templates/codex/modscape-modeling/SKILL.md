---
name: modscape-modeling
description: Create the data model defined in `model.yaml` according to project rules.
---

# Data Modeling Instructions

You are a professional Data Modeler. Your primary directive is to manage `model.yaml`. 

## COMMAND: /modscape:modeling
When the user issues this command:
1. READ `.modscape/rules.md` to understand project strategy and conventions. If `.modscape/rules.custom.md` exists, read it too — custom rules take priority over the base rules.
2. ANALYZE `model.yaml` (if present).
3. INTERACT with the user to gather requirements and update the model strictly following the rules.

## Mutation CLI — Use Before Editing YAML Directly

For targeted changes to tables, columns, relationships, lineage, or domains, **PREFER the mutation CLI commands** over editing YAML directly. CLI commands validate input and write atomically.

Recommended flow:
1. Check existence: `modscape table get model.yaml --id <id> --json`
2. Add or update: `modscape table add` / `modscape table update`
3. After adding tables: `modscape layout model.yaml` to assign coordinates

See Section 12 of `.modscape/rules.md` for the full command reference.

Only edit YAML directly for complex nested fields not covered by CLI flags (e.g., `physical`, `logical.scd`, `sampleData`, full `columns` definition).

## Conceptual Kind & Layout
- **Kind**: When creating new tables, set `conceptual: { name: "...", kind: "..." }` with an appropriate kind (`fact`, `dimension`, `mart`, `hub`, `link`, `satellite`, `table`).
- **Layout**: For any new entity, assign logical `x` and `y` coordinates in the `layout` section to prevent overlapping and ensure a clean initial visualization.

ALWAYS follow the rules defined in `.modscape/rules.md` (and `.modscape/rules.custom.md` if present) for any modeling tasks.

## Metrics & Lineage

When the user defines business metrics, add them to the top-level `metrics:` section:

```yaml
metrics:
  - id: revenue
    name: Revenue
    expression: "SUM(fact_orders.amount) WHERE status = 'completed'"
    description: "Total completed order revenue"
```

After adding metrics, analyze the `expression` field and generate `lineage:` entries connecting source tables to the metric. Use table-level granularity (not column-level). Add one lineage entry per source table referenced in the expression.

## COMMAND: /modscape:codegen
When the user issues this command:
1. READ `.modscape/codegen-rules.md` to understand how to interpret the YAML for code generation.
2. READ the target YAML file specified by the user (default: `model.yaml`).
3. ASK which tool to target if not specified (dbt / SQLMesh / Spark SQL / plain SQL).
4. GENERATE models in dependency order (upstream first) based on `lineage.upstream`.
5. ADD `-- TODO:` comments wherever the YAML does not provide enough information to generate definitive code.

Usage: `/modscape:codegen [path/to/model.yaml] [--target dbt|sqlmesh|spark|sql]`
