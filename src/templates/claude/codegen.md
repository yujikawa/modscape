Generate implementation code from a Modscape YAML model.

## Instructions
1. FIRST, read `.modscape/codegen-rules.md` to understand how to interpret the YAML.
2. SECOND, read the target YAML file specified by the user (default: `model.yaml`).
3. THIRD, load SDD context from `.modscape/specs/` if it exists:
   - `_context.yaml` — architecture decisions (apply to all models)
   - `_glossary.yaml` — business term definitions (use for column semantics)
   - `_questions.yaml` — Q&A; answered/assumed questions reduce TODOs, open questions become `-- TODO:`
   - `<table-id>/spec.md` for each table being generated — business rules, grain, dependencies
   Use this information to generate more accurate code and reduce speculative TODO comments.
4. Ask the user which tool to target if not specified (dbt / SQLMesh / Spark SQL / plain SQL).
5. Generate models in dependency order (upstream first) based on `lineage.upstream`.
6. Add `-- TODO:` comments only where no information (YAML or SDD context) resolves the ambiguity.

## Usage
```
/modscape:codegen
/modscape:codegen path/to/model.yaml
/modscape:codegen path/to/model.yaml --target dbt
```
