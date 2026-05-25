# Design: <pipeline title>

---

## Design Decisions

<!-- Each decision must record both the technical choice AND the business reason.
     "Because the spec says so" is not a rationale — explain the business logic or process. -->

- **<decision>** — <business reason>. *Technical: <technical note if needed>*

---

## Affected Tables

> ⚠️ This classification is an AI proposal. Edit directly if incorrect.

| Table | Impact | Details |
|-------|--------|---------|
| `<table-id>` | Direct | new / column added / restructured |
| `<table-id>` | Downstream — Implement | <which changed column is referenced and why this table must be updated> |
| `<table-id>` | Downstream — Context Only | <why no code change is needed> |

---

## Known Open Questions

*(Populated automatically. Only Direct Impact tables. Omit section if none.)*

- **Q-NNN** → `<table-id>` — see `.modscape/changes/<name>/questions.md`

---

## Related Past Specs

*(Populated automatically via `modscape spec search`. Omit section if no results.)*

- `archives/YYYY-MM-DD-<name>/` — <spec title>

---

## Implementation Details

<!-- Document details at a level that lets an implementer work from this file alone. -->
<!-- Supplement spec-model.yaml with human-readable transformation expressions, validation SQL, and test patterns. -->
<!-- Always include these when transformation expressions or validation SQL exist. -->

### `<table-id>`

- **Expression**: `<expression detail (e.g., CAST(raw_amount AS DECIMAL(18,2)) * fx_rate)>`
- **Filter condition**: `<WHERE clause condition (e.g., WHERE status != 'cancelled')>`
- **Validation SQL**: `<SQL to verify acceptance criteria (e.g., SELECT COUNT(*) FROM <table> WHERE amount IS NULL → 0 rows)>`
- **Test pattern**: `<PK/FK test approach (e.g., order_id is unique + not_null, customer_id has referential integrity to dim_customers)>`

---

## Findings

### Requires Model Change

*(Observations that require changes to `spec-model.yaml` — processed first on re-run)*

- `<table-id>`: <issue>

### Implementation Notes

*(Observations that do NOT require model changes — for reference only)*

- <note>
