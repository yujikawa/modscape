## ADDED Requirements

### Requirement: _context.yamlはプロジェクト横断の暗黙知のみを保持する

`_context.yaml`はSDD（Spec-Driven Development）のやり取りで生まれるプロジェクト横断の暗黙知を格納するファイルとする。スキーマ情報（テーブルの存在・カラム定義）はmodel.yamlが持つため、`_context.yaml`には含めてはならない。per-tableの暗黙知はspecs/<table-id>/spec.mdおよびquestions.mdに任せる。

有効なフィールド:
- `decisions`: プロジェクト全体に関わる設計判断・合意した慣習
  - `id` (必須): D-NNN形式
  - `summary` (必須): 判断内容の要約
  - `rationale` (任意): なぜその判断をしたか
  - `date` (任意): YYYY-MM-DD
  - `change` (任意): 生まれたchange名

廃止フィールド: `tables.*`（last_change, has_spec, open_questions）、`decisions[].affects`、`questions`セクション（Q&Aは`_questions.yaml`で一元管理）

#### Scenario: decisionsのみのファイルが有効
- **WHEN** `_context.yaml`が`decisions`セクションのみを持つ
- **THEN** パース・表示が正常に動作する

#### Scenario: 空のファイル（テンプレート）が有効
- **WHEN** `_context.yaml`が`decisions: []`のみを含む
- **THEN** パースエラーにならず空の状態として扱われる

---

### Requirement: _context.yaml は decisions のみを保持する
`_context.yaml` の `questions` セクションを削除し、`decisions` セクションのみを保持する構造に変更する。Q&A は `_questions.yaml` で一元管理する。

#### Scenario: _context.yaml に questions セクションが存在しない
- **WHEN** `_context.yaml` を読み込む
- **THEN** `questions` フィールドは存在せず、`decisions` のみが返される

#### Scenario: decisions の読み込みは従来通り機能する
- **WHEN** `_context.yaml` を parseContextYaml でパースする
- **THEN** decisions 配列が正しく返される

---

### Requirement: `spec new`実行時に`_context.yaml`の空テンプレートを自動生成する

`modscape spec new <name>`を実行したとき、`.modscape/specs/_context.yaml`が存在しない場合に限り、空テンプレートを自動生成する。既存ファイルがある場合は上書きしない。

テンプレートの内容:
```yaml
# .modscape/specs/_context.yaml
# Cross-project tacit knowledge from SDD interactions.
# Do NOT store schema info here — that belongs in model.yaml.
# Per-table knowledge belongs in specs/<table-id>/spec.md.
# Q&A is managed in _questions.yaml.

decisions: []
```

#### Scenario: 初回spec new実行時に_context.yamlが生成される
- **WHEN** `.modscape/specs/_context.yaml`が存在しない状態で`modscape spec new <name>`を実行する
- **THEN** `.modscape/specs/_context.yaml`が空テンプレートとして生成される

#### Scenario: 既存の_context.yamlは上書きされない
- **WHEN** `.modscape/specs/_context.yaml`が既に存在する状態で`modscape spec new <name>`を実行する
- **THEN** 既存の`_context.yaml`は変更されない

---

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
