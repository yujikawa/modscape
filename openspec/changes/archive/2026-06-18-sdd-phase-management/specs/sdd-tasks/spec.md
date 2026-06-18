## ADDED Requirements

### Requirement: 完了時に phase を tasks に設定する

`/modscape:spec:tasks` スキルは `tasks.md` の生成完了後に `modscape spec set-phase <name> tasks` を呼び出さなければならない（SHALL）。

#### Scenario: tasks スキル正常完了
- **WHEN** `/modscape:spec:tasks` が `tasks.md` の生成を完了する
- **THEN** `modscape spec set-phase <name> tasks` を実行し、`spec-config.yaml` の `phase` が `tasks` に設定される
