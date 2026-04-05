Gather business requirements interactively and generate `.modscape/sdd/spec.md`.

## Instructions

1. If `.modscape/sdd/sdd.custom.md` exists, read it **in addition** to these instructions.
   Rules in `sdd.custom.md` take **priority** when they conflict.

2. Check whether `.modscape/sdd/spec.md` already exists.
   - If it exists: show the current content and ask the user what to update.
   - If not: proceed to collect requirements from scratch.

3. Collect the following information through conversation:
   - **Pipeline title** — a short name for this pipeline or data product
   - **Goal** — who is this for and what problem does it solve?
   - **Stakeholders** — owner (team or person) and consumers (downstream users or systems)
   - **Data Sources** — existing tables, databases, or external systems that feed this pipeline
   - **Acceptance Criteria** — concrete, testable conditions for "done" (at least 2–3 items)
   - **Target Tool** — `dbt` | `SQLMesh` | `Spark SQL` | `plain SQL`

4. Write the collected requirements to `.modscape/sdd/spec.md` using the format below.
   Create the `.modscape/sdd/` directory if it does not exist.

5. Set `Status: requirements` in the spec file.

## spec.md Format

```markdown
# Pipeline Spec: <title>

## Goal
<Who is this for and what problem does it solve?>

## Stakeholders
- owner: <team or person>
- consumers: [<list of downstream users or systems>]

## Data Sources
- <source 1>
- <source 2>

## Acceptance Criteria
- [ ] <criterion 1>
- [ ] <criterion 2>

## Target Tool
<dbt | SQLMesh | Spark SQL | plain SQL>

## Status
requirements
```

## Usage

```
/modscape:sdd:requirements
```

## Next Step

After completing `spec.md`, guide the user:

> `spec.md` has been created. Run `/modscape:sdd:design` next to design the data model.
