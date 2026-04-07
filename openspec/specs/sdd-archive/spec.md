## MODIFIED Requirements

### Requirement: SDD作業完了時に恒久テーブルspecを自動同期する
AIスキル `/modscape:spec:archive <name>` は `changes/<name>/spec.md`・`changes/<name>/design.md`・`changes/<name>/model.yaml` を解析し、影響テーブルを特定して `.modscape/specs/<table-id>.md` を自動生成または更新しなければならない（SHALL）。また `changes/<name>/model.yaml` を本番のmaster model.yaml（HR.yaml等）にマージしなければならない（SHALL）。

スキルは以下を実行しなければならない（SHALL）:
- `changes/<name>/spec.md`・`changes/<name>/design.md`・`changes/<name>/model.yaml` の lineage を読み込む
- `modscape merge changes/<name>/model.yaml <master>.yaml --output <master>.yaml` でマージする（spec版優先）
- 重複テーブルIDが検出された場合、警告を表示してユーザーに通知する（処理はブロックしない）
- 直接影響テーブルに対して `specs/<table-id>.md` の Overview / Business Context / Business Rules / Known Issues を生成・更新する
- 間接影響テーブルに対して `specs/<table-id>.md` の Changelog のみ追記する
- 同期完了後「`changes/<name>/` を削除しますか？」とユーザーに確認する

#### Scenario: 作業用YAMLを本番YAMLにマージする
- **WHEN** archive を実行する
- **THEN** `modscape merge changes/<name>/model.yaml <master>.yaml --output <master>.yaml` が実行され、spec版が優先してマージされる

#### Scenario: 重複テーブルがある場合に警告する
- **WHEN** `changes/<name>/model.yaml` に本番YAMLと同じIDのテーブルが存在する状態で archive を実行する
- **THEN** AIは「⚠ <table-id> は本番YAMLにも存在します。spec版を使用します」と警告を表示し、処理を継続する

#### Scenario: 直接影響テーブルのspecを新規作成する
- **WHEN** `specs/<table-id>.md` が存在しない状態で archive を実行する
- **THEN** AIは `specs/<table-id>.md` を所定のフォーマットで新規作成し、Changelogに作業名と日付を記録する

#### Scenario: 直接影響テーブルの既存specを更新する
- **WHEN** `specs/<table-id>.md` が既存の状態で archive を実行する
- **THEN** AIは既存の内容を読み込み、変更された部分のみ差分更新してChangelogに追記する

#### Scenario: 同期完了後に削除確認を行う
- **WHEN** マージとすべての `specs/<table-id>.md` の同期が完了する
- **THEN** AIは「`changes/<name>/` を削除しますか？」と確認し、ユーザーの選択に応じて削除またはそのまま保持する
