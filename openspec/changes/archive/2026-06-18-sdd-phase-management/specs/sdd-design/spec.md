## ADDED Requirements

### Requirement: 完了時に phase を design に設定する

`/modscape:spec:design` スキルは設計成果物（`design.md` / `spec-model.yaml`）の更新完了後に `modscape spec set-phase <name> design` を呼び出さなければならない（SHALL）。

#### Scenario: design スキル正常完了（テーブル設計完了時）
- **WHEN** `/modscape:spec:design` が当該テーブルの設計を完了してセッションを終了する
- **THEN** `modscape spec set-phase <name> design` を実行し、`spec-config.yaml` の `phase` が `design` に設定される

#### Scenario: 全テーブル設計完了時
- **WHEN** Design Progress で全テーブルが `✅ Designed` になる
- **THEN** `modscape spec set-phase <name> design` を実行する（tasks スキルへの移行を促す）
