## ADDED Requirements

### Requirement: インクリメンタルモデルの比較列を明示できる
`implementation` に `incremental_key` フィールドを追加し、インクリメンタルモデルで WHERE 句のフィルターに使用する列名を明示できなければならない（SHALL）。

`incremental_key` は以下の制約を満たさなければならない（SHALL）:
- `implementation.materialization: incremental` と共に使用する
- 値はそのテーブルの列 ID（文字列）
- 省略可能。省略時は SDD implement スキルが列名から推測する（後退互換）

オプションとして `incremental_lookback` を設定できる（SHALL）:
- インクリメンタルフィルターの安全マージン（例: `"3 days"`）
- 省略時はマージンなし

#### Scenario: incremental_key から WHERE 句を生成する
- **WHEN** `implementation.incremental_key: updated_at` が設定されている
- **THEN** SDD implement スキルは `WHERE updated_at > {{ last_run_timestamp }}` 相当のフィルター句を生成する

#### Scenario: incremental_lookback を含む WHERE 句を生成する
- **WHEN** `incremental_key: updated_at` かつ `incremental_lookback: "3 days"` が設定されている
- **THEN** SDD implement スキルはルックバック期間を含むフィルター句（例: `WHERE updated_at > {{ last_run_timestamp }} - INTERVAL 3 DAY`）を生成する

#### Scenario: incremental_key が省略された場合は従来の推測挙動を維持する
- **WHEN** `materialization: incremental` だが `incremental_key` が設定されていない
- **THEN** SDD implement スキルは列名から推測してコードを生成する（後退互換）
