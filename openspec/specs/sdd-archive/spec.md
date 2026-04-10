## Requirements

### Requirement: SDD作業完了時に恒久テーブルspecを自動同期する
AIスキル `/modscape:spec:archive <name>` は `changes/<name>/spec.md`・`changes/<name>/design.md`・`changes/<name>/spec-model.yaml` を解析し、影響テーブルを特定して `.modscape/specs/<table-id>.md` を自動生成または更新しなければならない（SHALL）。また `changes/<name>/spec-model.yaml` を本番のmaster model.yaml（HR.yaml等）にマージしなければならない（SHALL）。

スキルは以下を実行しなければならない（SHALL）:
- `changes/<name>/spec.md`・`changes/<name>/design.md`・`changes/<name>/spec-model.yaml` の lineage を読み込む
- `modscape merge changes/<name>/spec-model.yaml <master>.yaml --output <master>.yaml --patch` でマージする（spec版優先）
- 重複テーブルIDが検出された場合、警告を表示してユーザーに通知する（処理はブロックしない）
- `design.md` から以下の分類を構築して spec 同期に使用する:
  - **Direct Impact** テーブル: `### Direct Impact` に列挙されたテーブル
  - **Downstream Impact — Implement** テーブル: `### Downstream Impact — Implement` に列挙されたテーブル
  - **Downstream Impact — Context Only** テーブル: `### Downstream Impact — Context Only` に列挙されたテーブル
  - `design.md` が存在しない、または `## Affected Tables` セクションが存在しない場合: `spec-model.yaml` のすべてのテーブルを Direct Impact として扱う（後方互換）
- Direct Impact および Downstream Impact — Implement テーブルに対して `specs/<table-id>.md` の Overview / Business Context / Business Rules / Known Issues を生成・更新する（フル同期）
- Downstream Impact — Context Only テーブルに対して `specs/<table-id>.md` の Changelog のみ追記する
- `changes/<name>/questions.md` を `.modscape/specs/questions.md` へテーブル単位フラットマージでsyncする
- 同期完了後、作業フォルダを `.modscape/archives/YYYY-MM-DD-<name>/` に移動する

#### Scenario: 作業用YAMLを本番YAMLにマージする
- **WHEN** archive を実行する
- **THEN** `modscape merge changes/<name>/spec-model.yaml <master>.yaml --output <master>.yaml --patch` が実行され、spec版が優先してマージされる

#### Scenario: 重複テーブルがある場合に警告する
- **WHEN** `changes/<name>/spec-model.yaml` に本番YAMLと同じIDのテーブルが存在する状態で archive を実行する
- **THEN** AIは「⚠ <table-id> は本番YAMLにも存在します。spec版を使用します」と警告を表示し、処理を継続する

#### Scenario: Direct Impact テーブルの specをフル同期する
- **WHEN** archive を実行し、テーブルが `### Direct Impact` に分類されている
- **THEN** AIは `specs/<table-id>.md` の Overview / Business Context / Business Rules / Known Issues を生成・更新し、Changelogに作業名と日付を記録する

#### Scenario: Downstream Impact — Implement テーブルの spec をフル同期する
- **WHEN** archive を実行し、テーブルが `### Downstream Impact — Implement` に分類されている
- **THEN** AIは `specs/<table-id>.md` の Overview / Business Context / Business Rules / Known Issues を生成・更新し、Changelogに作業名と日付を記録する

#### Scenario: Context Only テーブルは Changelog のみ追記する
- **WHEN** archive を実行し、テーブルが `### Downstream Impact — Context Only` に分類されている
- **THEN** AIはフル spec 同期を行わず、`specs/<table-id>.md` の Changelog に「Referenced in downstream lineage; no structural change required (SDD: <name>)」のみ追記する

#### Scenario: questions.md を specs/questions.md へsyncする
- **WHEN** archive を実行し `changes/<name>/questions.md` が存在する
- **THEN** AIは `.modscape/specs/questions.md` へテーブル単位フラットマージを行い、矛盾・廃止があればコメントを付記する

#### Scenario: design.md が存在しない場合のフォールバック
- **WHEN** `.modscape/changes/<name>/design.md` が存在しない状態で archive を実行する
- **THEN** `spec-model.yaml` のすべてのテーブルを Direct Impact として扱い、すべてに対してフル spec 同期を実行する

#### Scenario: 同期完了後に作業フォルダをアーカイブする
- **WHEN** マージとすべての `specs/<table-id>.md` の同期が完了する
- **THEN** AIは `.modscape/changes/<name>/` を `.modscape/archives/YYYY-MM-DD-<name>/` に移動する
