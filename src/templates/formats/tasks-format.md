# Pipeline Tasks
> Generated from: .modscape/changes/<name>/spec-model.yaml
> Spec: .modscape/changes/<name>/spec.md
> Progress: 0 / <total>

## Phase 1: Staging

- [ ] `<table_id>` [<materialization>]

## Phase 2: Core

- [ ] `<table_id>` [<materialization>] ← <upstream_1>, <upstream_2>

## Phase 3: Mart

- [ ] `<table_id>` [<materialization>] ← <upstream_1>

## Phase 4: Tests

- [ ] `<table_id>` — <column_id>: unique, not_null
- [ ] `<table_a>` → `<table_b>` FK test

## Context Only (Skipped)

<!-- Tables classified as "Downstream Impact — Context Only" in design.md. No implementation needed. -->

- `<table_id>` — <reason from design.md>
