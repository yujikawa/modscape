## MODIFIED Requirements

### Requirement: SDD作業完了時に恒久テーブルspecを自動同期する
AIスキル `/modscape:spec:archive <name>` は `changes/<name>/spec.md`・`changes/<name>/design.md`・`changes/<name>/spec-model.yaml` を解析し、影響テーブルを特定して `.modscape/specs/<table-id>.md` を自動生成または更新しなければならない（SHALL）。また `changes/<name>/spec-model.yaml` を本番のmaster model.yaml（HR.yaml等）にマージしなければならない（SHALL）。

スキルは以下を実行しなければならない（SHALL）:
- `changes/<name>/spec.md`・`changes/<name>/design.md`・`changes/<name>/spec-model.yaml` の lineage を読み込む
- `design.md` が存在する場合、`### Downstream Impact — Context Only` セクションのテーブル ID をリストアップする
- `modscape merge changes/<name>/spec-model.yaml <master>.yaml --output <master>.yaml` でマージする（spec版優先）
- 重複テーブルIDが検出された場合、警告を表示してユーザーに通知する（処理はブロックしない）
- Direct Impact および `Downstream Impact — Implement` テーブルに対して `specs/<table-id>.md` の Overview / Business Context / Business Rules / Known Issues を生成・更新する
- `Downstream Impact — Context Only` テーブルに対して `specs/<table-id>.md` の Changelog のみ追記する（フル spec 作成・更新は行わない）
- 同期完了後「`changes/<name>/` を削除しますか？」とユーザーに確認する

#### Scenario: 作業用YAMLを本番YAMLにマージする
- **WHEN** archive を実行する
- **THEN** `modscape merge changes/<name>/spec-model.yaml <master>.yaml --output <master>.yaml` が実行され、spec版が優先してマージされる

#### Scenario: 重複テーブルがある場合に警告する
- **WHEN** `changes/<name>/spec-model.yaml` に本番YAMLと同じIDのテーブルが存在する状態で archive を実行する
- **THEN** AIは「⚠ <table-id> は本番YAMLにも存在します。spec版を使用します」と警告を表示し、処理を継続する

#### Scenario: Direct Impact テーブルのspecをフル同期する
- **WHEN** `design.md` の `### Direct Impact` に列挙されているテーブルの archive を実行する
- **THEN** AIは `specs/<table-id>.md` の Overview / Business Context / Business Rules / Known Issues をフル同期し、Changelogに作業名と日付を記録する

#### Scenario: Downstream Impact — Implement テーブルのspecをフル同期する
- **WHEN** `design.md` の `### Downstream Impact — Implement` に列挙されているテーブルの archive を実行する
- **THEN** AIは `specs/<table-id>.md` の Overview / Business Context / Business Rules / Known Issues をフル同期し、Changelogに作業名と日付を記録する

#### Scenario: Context Only テーブルには Changelog のみ追記する
- **WHEN** `design.md` の `### Downstream Impact — Context Only` に列挙されているテーブルの archive を実行する
- **THEN** AIは `specs/<table-id>.md` のフル同期は行わず、Changelog セクションに今回の変更エントリのみ追記する

#### Scenario: design.md が存在しない場合に全テーブルをフル同期する
- **WHEN** `changes/<name>/design.md` が存在しない状態で archive を実行する
- **THEN** AIはすべての影響テーブルをフル spec sync の対象として処理する（後退互換）

#### Scenario: 同期完了後に削除確認を行う
- **WHEN** マージとすべての `specs/<table-id>.md` の同期が完了する
- **THEN** AIは「`changes/<name>/` を削除しますか？」と確認し、ユーザーの選択に応じて削除またはそのまま保持する
