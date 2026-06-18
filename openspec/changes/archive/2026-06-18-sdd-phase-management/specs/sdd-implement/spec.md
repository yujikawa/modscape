## ADDED Requirements

### Requirement: 初回実行時に phase を implement に設定する

`/modscape:spec:implement` スキルは最初のタスク実装開始前に `modscape spec set-phase <name> implement` を呼び出さなければならない（SHALL）。既に `phase: implement` の場合は呼び出しをスキップしてよい（MAY）。

#### Scenario: implement スキル初回実行
- **WHEN** `phase` が `tasks` の状態で `/modscape:spec:implement` を初めて実行する
- **THEN** 実装開始前に `modscape spec set-phase <name> implement` を実行する

#### Scenario: implement スキル再実行（フェーズ変更不要）
- **WHEN** `phase` が既に `implement` の状態で `/modscape:spec:implement` を実行する
- **THEN** `set-phase` の呼び出しをスキップして実装を継続する
