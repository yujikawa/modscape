## Requirements

### Requirement: `modscape spec context --ids` でテーブルIDに関連する知識を取得する

CLI は `modscape spec context --ids <id1>,<id2>,...` コマンドを提供しなければならない（SHALL）。コンマ区切りで複数のテーブルIDを指定できなければならない（SHALL）。

コマンドは `.modscape/specs/_context.yaml`・`.modscape/specs/_glossary.yaml`・`.modscape/specs/_questions.yaml` を読み込み、指定テーブルIDに関連するエントリのみを返さなければならない（SHALL）。

**フィルタリングロジック:**
- `_context.yaml` decisions: `ids` に指定テーブルIDを1つ以上含むエントリ、または `scope: global` のエントリ
- `_questions.yaml` questions: `ids` に指定テーブルIDを1つ以上含む、かつ `status: answered` または `status: assumed` のエントリのみ（`status: open` は除外する）
- `_glossary.yaml` terms: `ids` に指定テーブルIDを1つ以上含むエントリ、または `ids` が空のエントリ

テキスト出力（`--json` なし）では各セクションを見やすく整形して標準出力しなければならない（SHALL）。

#### Scenario: 単一テーブルIDで関連知識を取得する
- **WHEN** `modscape spec context --ids fct_orders` を実行する
- **THEN** `_context.yaml` の `ids` に `fct_orders` を含む decisions、`_questions.yaml` の answered/assumed かつ `ids` に `fct_orders` を含む questions、`_glossary.yaml` の `ids` に `fct_orders` を含むまたは `ids` が空の terms が整形されて出力される

#### Scenario: 複数テーブルIDをコンマ区切りで指定する
- **WHEN** `modscape spec context --ids fct_orders,dim_customers` を実行する
- **THEN** 両方のテーブルIDに関連するエントリがすべて出力される

#### Scenario: scope: global のエントリが常に含まれる
- **WHEN** `_context.yaml` に `scope: global` を持つエントリが存在し、`modscape spec context --ids fct_orders` を実行する
- **THEN** `scope: global` のエントリが指定IDと無関係でも出力に含まれる

#### Scenario: status: open の questions は除外される
- **WHEN** `_questions.yaml` に `ids: [fct_orders]` かつ `status: open` のエントリが存在する
- **THEN** そのエントリは出力に含まれない

### Requirement: `--json` フラグで機械可読なJSON出力を返す

`modscape spec context --ids <ids> --json` は以下の構造のJSONを標準出力しなければならない（SHALL）。

```json
{
  "for_ids": ["fct_orders", "dim_customers"],
  "decisions": [
    { "id": "D-002", "summary": "...", "ids": ["fct_orders"] }
  ],
  "rules": [
    { "id": "Q-001", "rule": "...", "why": "...", "counter_case": "...", "applies_to": ["fct_orders"] }
  ],
  "terms": [
    { "id": "order-line", "label": "...", "definition": "..." }
  ]
}
```

`change`・`date` などのプロベナンス情報は出力に含めてはならない（SHALL NOT）。

#### Scenario: --json フラグで JSON 形式で出力される
- **WHEN** `modscape spec context --ids fct_orders --json` を実行する
- **THEN** `for_ids`・`decisions`・`rules`・`terms` キーを持つJSONオブジェクトが標準出力に出力される

#### Scenario: JSON 出力に change・date フィールドが含まれない
- **WHEN** `modscape spec context --ids fct_orders --json` を実行する
- **THEN** 出力 JSON の decisions/rules/terms エントリに `change` フィールドおよび `date` フィールドは含まれない

#### Scenario: 該当エントリが存在しない場合は空配列を返す
- **WHEN** 指定テーブルIDに関連するエントリが存在しない状態で `--json` を付けて実行する
- **THEN** `decisions`・`rules`・`terms` がすべて空配列の JSON が返される
