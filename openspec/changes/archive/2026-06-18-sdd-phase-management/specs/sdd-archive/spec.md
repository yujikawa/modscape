## ADDED Requirements

### Requirement: 完了時に phase を done に設定する

`/modscape:spec:archive` スキルはアーカイブ処理の完了後に `modscape spec set-phase <name> done` を呼び出さなければならない（SHALL）。

#### Scenario: archive スキル正常完了
- **WHEN** `/modscape:spec:archive` がアーカイブ処理（YAML マージ・フォルダ移動）を完了する
- **THEN** `modscape spec set-phase <name> done` を実行し、`spec-config.yaml` の `phase` が `done` に設定される
