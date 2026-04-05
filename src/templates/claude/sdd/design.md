Design the data model based on `spec.md` and update `model.yaml`.

## Instructions

1. Read `.modscape/rules.md` to understand the YAML schema and modeling rules.
   If `.modscape/sdd/sdd.custom.md` exists, read it too — its rules take **priority**.

2. Check that `.modscape/sdd/spec.md` exists.
   - If it does not exist: stop and tell the user:
     > `spec.md` not found. Run `/modscape:sdd:requirements` first to create it.

3. Read `.modscape/sdd/spec.md` fully. Extract:
   - **Goal** — the purpose of the pipeline
   - **Data Sources** — what tables/systems feed the pipeline
   - **Acceptance Criteria** — what the output must deliver
   - **Target Tool** — dbt / SQLMesh / Spark SQL / plain SQL

4. Design the data model:
   - Propose tables (with `appearance.type`: staging → core fact/dimension → mart)
   - Define `lineage` entries to express data flow between tables
   - Group related tables into `domains`
   - Add `conceptual.description` and BEAM* tags to each table where relevant
   - Add `implementation` hints (materialization, incremental strategy, grain, measures) where the target tool and table type make them clear

5. Apply changes to `model.yaml` using mutation CLI commands where possible:
   ```bash
   modscape table add model.yaml --id <id> --name "<name>" --type <type>
   modscape domain add model.yaml --id <id> --name "<name>"
   modscape lineage add model.yaml --from <from> --to <to>
   ```
   Edit YAML directly only for complex nested fields (`implementation`, `columns`, `sampleData`).

6. After all tables are added, run:
   ```bash
   modscape layout model.yaml
   ```

7. Update `Status` in `.modscape/sdd/spec.md` from `requirements` to `design`.

## Usage

```
/modscape:sdd:design
/modscape:sdd:design path/to/model.yaml
```

## Next Step

After updating `model.yaml`, guide the user:

> `model.yaml` has been updated. Run `/modscape:sdd:tasks` next to generate the implementation task list.
