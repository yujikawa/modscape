## MODIFIED Requirements

### Requirement: SDD作業完了時に恒久テーブルspecを自動同期する
AIスキル `/modscape:spec:archive <name>` は `changes/<name>/spec.md`・`changes/<name>/design.md`・`changes/<name>/spec-model.yaml` を解析し、影響テーブルを特定して `.modscape/specs/<table-id>.md` を自動生成または更新しなければならない（SHALL）。また `changes/<name>/spec-model.yaml` を本番のmaster model.yaml（HR.yaml等）にマージしなければならない（SHALL）。

スキルはマージを実行する前に dry-run サマリーを表示し、ユーザーの確認を得てからマージを実行しなければならない（SHALL）。

dry-run サマリーは以下の情報を ID 単位で表示しなければならない（SHALL）:
- 追加されるテーブルの ID 一覧
- 更新されるテーブルの ID と変更内容（追加・削除されるカラム名）
- 変更なし（Context Only）のテーブルの ID 一覧

ユーザーが確認を拒否した場合、マージを実行せずに終了しなければならない（SHALL）。

スキルは以下を実行しなければならない（SHALL）:
- `changes/<name>/spec.md`・`changes/<name>/design.md`・`changes/<name>/spec-model.yaml` の lineage を読み込む
- dry-run サマリーを表示し確認を得た後、`modscape merge changes/<name>/spec-model.yaml <master>.yaml --output <master>.yaml --patch` でマージする（spec版優先）
- 重複テーブルIDが検出された場合、警告を表示してユーザーに通知する（処理はブロックしない）
- `design.md` から以下の分類を構築して spec 同期に使用する:
  - **Direct Impact** テーブル: `### Direct Impact` に列挙されたテーブル
  - **Downstream Impact — Implement** テーブル: `### Downstream Impact — Implement` に列挙されたテーブル
  - **Downstream Impact — Context Only** テーブル: `### Downstream Impact — Context Only` に列挙されたテーブル
  - `design.md` が存在しない、または `## Affected Tables` セクションが存在しない場合: `spec-model.yaml` のすべてのテーブルを Direct Impact として扱う（後方互換）
- Direct Impact および Downstream Impact — Implement テーブルに対して `specs/<table-id>.md` の Overview / Business Context / Business Rules / Known Issues を生成・更新する（フル同期）
- Downstream Impact — Context Only テーブルに対して `specs/<table-id>.md` の Changelog のみ追記する
- `changes/<name>/questions.md` を `.modscape/specs/questions.md` へテーブル単位フラットマージでsyncする
- archive サマリーに AC カバレッジを含める: テスト紐付きの AC・手動検証の AC・未カバーの AC を明示する
- 同期完了後、作業フォルダを `.modscape/archives/YYYY-MM-DD-<name>/` に移動する

#### Scenario: マージ前に dry-run サマリーを表示して確認を取る
- **WHEN** `/modscape:spec:archive <name>` を実行する
- **THEN** 「追加するテーブル / 更新するテーブル（変更カラム）/ 変更なし」の ID 単位サマリーが表示され、「このまま進めますか？」の確認が求められる

#### Scenario: ユーザーが確認を拒否した場合にマージをスキップする
- **WHEN** dry-run サマリー確認で N または拒否を選択する
- **THEN** マージは実行されず「Archive cancelled.」と表示して終了する

#### Scenario: 作業用YAMLを本番YAMLにマージする
- **WHEN** dry-run サマリー確認で承認する
- **THEN** `modscape merge changes/<name>/spec-model.yaml <master>.yaml --output <master>.yaml --patch` が実行され、spec版が優先してマージされる

#### Scenario: 重複テーブルがある場合に警告する
- **WHEN** `changes/<name>/spec-model.yaml` に本番YAMLと同じIDのテーブルが存在する状態で archive を実行する
- **THEN** AIは「⚠ <table-id> は本番YAMLにも存在します。spec版を使用します」と警告を表示し、処理を継続する

#### Scenario: Direct Impact テーブルの specをフル同期する
- **WHEN** archive を実行し、テーブルが `### Direct Impact` に分類されている
- **THEN** AIは `specs/<table-id>.md` の Overview / Business Context / Business Rules / Known Issues を生成・更新し、Changelogに作業名と日付を記録する

#### Scenario: archive サマリーに AC カバレッジを含める
- **WHEN** `/modscape:spec:archive <name>` が完了する
- **THEN** サマリーに「テスト紐付き AC: N 件 / 手動検証: N 件 / 未カバー: N 件（手動検証が必要）」が表示される
