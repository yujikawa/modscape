## ADDED Requirements

### Requirement: 完了時に phase を requirements に設定する

`/modscape:spec:requirements` スキルは `spec.md` の書き込み完了後に `modscape spec set-phase <name> requirements` を呼び出さなければならない（SHALL）。

#### Scenario: requirements スキル正常完了
- **WHEN** `/modscape:spec:requirements` が `spec.md` の書き込みを完了する
- **THEN** `modscape spec set-phase <name> requirements` を実行し、`spec-config.yaml` の `phase` が `requirements` に設定される

#### Scenario: spec.md 書き込み失敗時は set-phase を呼ばない
- **WHEN** `spec.md` の書き込みが失敗またはキャンセルされる
- **THEN** `modscape spec set-phase` は呼び出されない
