## ADDED Requirements

### Requirement: no-duplicate-table-ids ルール
複数の model YAML ファイルをまたいで、同一テーブル ID が `imports:` での明示的な参照なしに重複定義されている場合を検知するルール `no-duplicate-table-ids` を提供しなければならない（SHALL）。デフォルト severity は `warn` でなければならない（SHALL）。

#### Scenario: 重複テーブルIDをwarningとして報告する
- **WHEN** `main-model1.yaml` と `main-model2.yaml` の両方に `id: tableA` が定義されており、どちらも import 関係にない状態で `modscape lint main-model1.yaml main-model2.yaml` を実行する
- **THEN** `tableA` について `no-duplicate-table-ids` ルールの warning が報告され、どのファイルに存在するかが表示される

#### Scenario: import で参照されている場合は重複と見なさない
- **WHEN** `fileA.yaml` が `tableA` を定義しており、`fileB.yaml` が `imports: [{ from: fileA.yaml, ids: [tableA] }]` で参照している状態で lint を実行する
- **THEN** `tableA` に対して `no-duplicate-table-ids` の warning は報告されない

#### Scenario: ids指定なしのimportも重複と見なさない
- **WHEN** `fileB.yaml` が `imports: [{ from: fileA.yaml }]`（ids指定なし）で全テーブルをimportしており、`fileA.yaml` に `tableA` が存在する場合
- **THEN** `tableA` に対して `no-duplicate-table-ids` の warning は報告されない

#### Scenario: --json出力に重複情報が含まれる
- **WHEN** `modscape lint --json` を複数ファイルで実行し、重複テーブルIDが存在する
- **THEN** warnings 配列に `rule: "no-duplicate-table-ids"` のエントリが含まれ、`files` フィールドに重複が検出されたファイルパスのリストが含まれる

#### Scenario: lint-rules.yamlでno-duplicate-table-idsをoffにできる
- **WHEN** `.modscape/lint-rules.yaml` に `no-duplicate-table-ids: { severity: off }` が設定されている
- **THEN** 重複テーブルIDが存在しても報告されない
