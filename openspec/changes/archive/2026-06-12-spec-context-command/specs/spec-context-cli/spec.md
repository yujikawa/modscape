## ADDED Requirements

### Requirement: `modscape spec context --ids` でテーブルIDに関連する知識を取得する

`modscape spec context --ids <id1>,<id2>,...` コマンドは `.modscape/specs/_context.yaml`・`_glossary.yaml`・`_questions.yaml` の3ファイルから、指定されたテーブルIDに関連するエントリを一括取得して返さなければならない（SHALL）。

フィルタリングルール:
- `_context.yaml` decisions: `ids` に指定IDを1つ以上含むエントリ、または `scope: global` のエントリを返す
- `_questions.yaml` questions: `ids` に指定IDを1つ以上含み、かつ `status: answered` または `status: assumed` のエントリのみを返す（`status: open` は除外する）
- `_glossary.yaml` terms: `ids` に指定IDを1つ以上含むエントリを返す。`ids` が空のエントリも返す

出力には `change`・`date` などのプロベナンスフィールドを含めてはならない（SHALL NOT）。

#### Scenario: 単一テーブルIDでフィルタリングされたエントリが返る
- **WHEN** `modscape spec context --ids fct_orders --json` を実行する
- **THEN** 3ファイルのうち `ids` に `fct_orders` を含むエントリのみが返り、`change`・`date` フィールドは含まれない

#### Scenario: 複数テーブルIDを指定するとOR条件で絞り込まれる
- **WHEN** `modscape spec context --ids fct_orders,dim_customers --json` を実行する
- **THEN** `fct_orders` または `dim_customers` を `ids` に含むエントリがすべて返る

#### Scenario: `scope: global` のエントリは常に返る
- **WHEN** `scope: global` を持つ decision が `_context.yaml` に存在し、`modscape spec context --ids fct_orders --json` を実行する
- **THEN** そのエントリは `fct_orders` に関係なく結果に含まれる

#### Scenario: `status: open` の質問は返らない
- **WHEN** `ids: [fct_orders]` かつ `status: open` の質問が `_questions.yaml` に存在し、`modscape spec context --ids fct_orders --json` を実行する
- **THEN** そのエントリは結果に含まれない

#### Scenario: 該当エントリがない場合は空の結果を返す
- **WHEN** 指定テーブルIDにマッチするエントリが存在しない
- **THEN** `decisions: []`・`rules: []`・`terms: []` を含む空のJSONが返る

#### Scenario: `.modscape/specs/` が存在しない場合でもエラーにならない
- **WHEN** `.modscape/specs/` ディレクトリが存在しないプロジェクトで実行する
- **THEN** 空の結果が返り、エラーは発生しない

### Requirement: `--json` フラグで機械可読なJSON出力を返す

`--json` フラグを指定した場合、以下の構造で JSON を標準出力に返さなければならない（SHALL）。

```json
{
  "for_ids": ["<id1>", "<id2>"],
  "decisions": [
    { "id": "D-NNN", "summary": "...", "ids": ["<id>"] }
  ],
  "rules": [
    { "id": "Q-NNN", "rule": "...", "applies_to": ["<id>"] }
  ],
  "terms": [
    { "id": "<term-id>", "label": "...", "definition": "..." }
  ]
}
```

`rules[].rule` フィールドは `_questions.yaml` の `answer` または `assumption` の値を使用する。`applies_to` フィールドは `_questions.yaml` の `ids` の値を使用する。

#### Scenario: --json フラグで正しい構造のJSONが返る
- **WHEN** `modscape spec context --ids fct_orders --json` を実行し、マッチするエントリが存在する
- **THEN** `for_ids`・`decisions`・`rules`・`terms` キーを持つ有効なJSONが標準出力に返る

#### Scenario: --json なしのテキスト出力も正常に動作する
- **WHEN** `modscape spec context --ids fct_orders` を `--json` なしで実行する
- **THEN** 人間が読みやすい形式でセクション別にエントリが表示される
