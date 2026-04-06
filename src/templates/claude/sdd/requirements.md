Gather business requirements interactively and generate `.modscape/sdd/<name>/spec.md`.

## Instructions

1. If `.modscape/sdd/sdd.custom.md` exists, read it **in addition** to these instructions.
   Rules in `sdd.custom.md` take **priority** when they conflict.

2. Collect the following information through conversation:
   - **Pipeline title** — a short name for this pipeline or data product
   - **Goal** — who is this for and what problem does it solve?
   - **Stakeholders** — owner (team or person) and consumers (downstream users or systems)
   - **Data Sources** — existing tables, databases, or external systems that feed this pipeline
   - **Acceptance Criteria** — concrete, testable conditions for "done" (at least 2–3 items)
   - **Target Tool** — `dbt` | `SQLMesh` | `Spark SQL` | `plain SQL`

3. After collecting requirements, propose a work folder name:
   - Derive a short, descriptive kebab-case name from the pipeline title (e.g., `monthly-sales-summary`)
   - Present the proposed name to the user:
     > Proposed folder name: `<name>`. Is this OK? (Reply with a different name to rename.)
   - Wait for user confirmation or rename.

4. Check whether `.modscape/sdd/<name>/` already exists.
   - If it exists: warn the user:
     > `sdd/<name>/` already exists. Please specify a different name.
   - If not: proceed to create the directory.

5. Check whether `.modscape/sdd/<name>/spec.md` already exists.
   - If it exists: show the current content and ask the user what to update.
   - If not: write the collected requirements using the format below.

6. Write the requirements to `.modscape/sdd/<name>/spec.md`.
   Create the `.modscape/sdd/<name>/` directory if it does not exist.

7. Set `Status: requirements` in the spec file.

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

> `spec.md` has been created at `.modscape/sdd/<name>/spec.md`.
> Run `/modscape:sdd:design <name>` next to design the data model.
