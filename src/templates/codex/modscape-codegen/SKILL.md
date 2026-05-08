---
name: modscape-codegen
description: Generate implementation code (dbt, SQLMesh, Spark SQL, etc.) from a Modscape YAML model.
---

# Code Generation from Modscape YAML

You are a data pipeline engineer. Your task is to generate implementation code from a Modscape `model.yaml`.

BEFORE generating any code, you MUST read `.modscape/codegen-rules.md` to understand how to interpret the YAML.

## Steps
1. READ `.modscape/codegen-rules.md`.
2. READ the target YAML file specified by the user (default: `model.yaml`).
3. LOAD SDD context from `.modscape/specs/` if it exists:
   - `_context.yaml` — architecture decisions (apply to all models)
   - `_glossary.yaml` — business term definitions (use for column semantics)
   - `_questions.yaml` — Q&A; answered/assumed questions reduce TODOs, open questions become `-- TODO:`
   - `<table-id>/spec.md` for each table being generated — business rules, grain, dependencies
   Use this information to generate more accurate code and reduce speculative TODO comments.
4. ASK which tool to target if not specified (dbt / SQLMesh / Spark SQL / plain SQL).
5. GENERATE models in dependency order (upstream first) based on `lineage.upstream`.
6. ADD `-- TODO:` comments only where no information (YAML or SDD context) resolves the ambiguity.

## COMMAND: /modscape:codegen
Usage: `/modscape:codegen [path/to/model.yaml] [--target dbt|sqlmesh|spark|sql]`
