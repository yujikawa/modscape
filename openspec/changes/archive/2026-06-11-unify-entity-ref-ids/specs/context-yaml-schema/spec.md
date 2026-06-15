## ADDED Requirements

### Requirement: `decisions[].ids` でエンティティ参照を持てる

`_context.yaml` の `decisions[]` エントリは任意フィールド `ids`（string[]）を持てる。`ids` はこの決定が影響するエンティティID（テーブル・リレーション・ドメイン・メトリクス等）のリストとする。

```yaml
decisions:
  - id: D-005
    summary: "fct_orders の status カラムで注文状態を管理"
    date: 2026-06-11
    change: add-order-status
    ids: [fct_orders, rel_orders_customers]
```

#### Scenario: ids フィールドを持つ decision が有効
- **WHEN** `ids: [fct_orders]` を持つ decision が `_context.yaml` に存在する
- **THEN** パーサーはそのエントリを有効な `DecisionEntry` として返す

#### Scenario: ids を省略した既存 decision は引き続き有効
- **WHEN** `ids` フィールドを持たない decision が `_context.yaml` に存在する
- **THEN** パーサーはそのエントリを有効な `DecisionEntry` として返す（後方互換）
