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

<!-- 実装者がここだけ読めば実装できる水準の詳細を記載する。 -->
<!-- spec-model.yaml の内容の人間可読な補足として、変換式・検証SQL・テストパターンを書く。 -->
<!-- 変換式や検証SQLが存在する場合は必ず記載すること。 -->

### `<table-id>`

- **変換式**: `<expression の詳細 (例: CAST(raw_amount AS DECIMAL(18,2)) * fx_rate)>`
- **フィルター条件**: `<WHERE 句の条件 (例: WHERE status != 'cancelled')>`
- **検証SQL**: `<受け入れ条件を検証するための SQL (例: SELECT COUNT(*) FROM <table> WHERE amount IS NULL → 0件)>`
- **テストパターン**: `<PK/FK テストの方針 (例: order_id は unique + not_null、customer_id は dim_customers への referential integrity)>`

---

## Findings

### Requires Model Change

*(Observations that require changes to `spec-model.yaml` — processed first on re-run)*

- `<table-id>`: <issue>

### Implementation Notes

*(Observations that do NOT require model changes — for reference only)*

- <note>
