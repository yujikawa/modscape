## Requirements

### Requirement: SDD作業完了時に恒久テーブルspecを自動同期する
AIスキル `/modscape:spec:archive <name>` は `changes/<name>/spec.md`・`changes/<name>/design.md`・`changes/<name>/spec-model.yaml` を解析し、影響テーブルを特定して `.modscape/specs/<table-id>/spec.md` を自動生成または更新しなければならない（SHALL）。また `changes/<name>/spec-model.yaml` を本番の main model.yaml にマージしなければならない（SHALL）。

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
- Direct Impact および Downstream Impact — Implement テーブルに対して `specs/<table-id>/spec.md` の Overview / Business Context / Business Rules / Known Issues を生成・更新する（フル同期）
- Downstream Impact — Context Only テーブルに対して `specs/<table-id>/spec.md` の Changelog のみ追記する
- `changes/<name>/questions.md` の `## Table-level` セクションを各テーブルの `specs/<table-id>/questions.md` へ同期する（テーブル単位分割マージ）
- `changes/<name>/questions.md` の `## Pipeline-level` セクションは `specs/` に昇格させず、archive フォルダに残す
- archive サマリーに AC カバレッジを含める: テスト紐付きの AC・手動検証の AC・未カバーの AC を明示する
- `specs/_context.yaml` を更新する: 対象テーブルの `last_change`・`open_questions`・`has_spec` を書き込む
- 重要なパイプラインレベル決定事項は `specs/_context.yaml` の `decisions` セクションに要約として追記する
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

#### Scenario: Direct Impact テーブルの spec をテーブルディレクトリに生成する
- **WHEN** archive を実行し、テーブルが `### Direct Impact` に分類されている
- **THEN** `.modscape/specs/<table-id>/spec.md` が生成・更新され、`.modscape/specs/<table-id>/questions.md` も同期される

#### Scenario: Downstream Impact — Implement テーブルの spec をフル同期する
- **WHEN** archive を実行し、テーブルが `### Downstream Impact — Implement` に分類されている
- **THEN** AIは `specs/<table-id>/spec.md` の Overview / Business Context / Business Rules / Known Issues を生成・更新し、Changelogに作業名と日付を記録する

#### Scenario: Context Only テーブルは Changelog のみ追記する
- **WHEN** archive を実行し、テーブルが `### Downstream Impact — Context Only` に分類されている
- **THEN** AIはフル spec 同期を行わず、`specs/<table-id>/spec.md` の Changelog に「Referenced in downstream lineage; no structural change required (SDD: <name>)」のみ追記する

#### Scenario: テーブル questions が per-table ディレクトリに同期される
- **WHEN** archive を実行し `changes/<name>/questions.md` の `## Table-level` に `### fct_orders` セクションが存在する
- **THEN** `.modscape/specs/fct_orders/questions.md` に Q&A が同期される

#### Scenario: Pipeline-level 質問は specs/ に昇格されない
- **WHEN** archive を実行し `changes/<name>/questions.md` の `## Pipeline-level` に質問が存在する
- **THEN** pipeline-level 質問は `specs/` には書き込まれず、archive フォルダ内に保持される

#### Scenario: `_context.yaml` が archive 後に更新される
- **WHEN** archive が完了する
- **THEN** `specs/_context.yaml` の対象テーブルに `last_change`・`open_questions`・`has_spec` が書き込まれる

#### Scenario: 旧形式フラットファイルを自動マイグレーションする
- **WHEN** archive 時に `specs/fct_orders.md`（旧フラット形式）が存在する
- **THEN** `specs/fct_orders/spec.md` に移動してから処理を継続する

#### Scenario: design.md が存在しない場合のフォールバック
- **WHEN** `.modscape/changes/<name>/design.md` が存在しない状態で archive を実行する
- **THEN** `spec-model.yaml` のすべてのテーブルを Direct Impact として扱い、すべてに対してフル spec 同期を実行する

#### Scenario: archive サマリーに AC カバレッジを含める
- **WHEN** `/modscape:spec:archive <name>` が完了する
- **THEN** サマリーに「テスト紐付き AC: N 件 / 手動検証: N 件 / 未カバー: N 件（手動検証が必要）」が表示される

#### Scenario: 同期完了後に作業フォルダをアーカイブする
- **WHEN** マージとすべての `specs/<table-id>/spec.md` の同期が完了する
- **THEN** AIは `.modscape/changes/<name>/` を `.modscape/archives/YYYY-MM-DD-<name>/` に移動する

## ADDED Requirements

### Requirement: archive 時に glossary.md を _glossary.yaml にマージする
`archive` スキルは `.modscape/changes/<name>/glossary.md` が存在する場合、その内容を `.modscape/specs/_glossary.yaml` にマージしなければならない（SHALL）。マージ後、`glossary.md` を削除しなければならない（SHALL）。

マージ戦略：
- `id` で既存エントリを照合する
- 未登録の場合 → `_glossary.yaml` の `terms:` に新規追加する
- 既登録の場合 → `change` フィールドのみ更新し、`definition` は上書きしない（手動編集を保護する）
- `_glossary.yaml` が存在しない場合 → 新規作成してマージする

#### Scenario: glossary.md が存在する場合にマージが実行される
- **WHEN** `.modscape/changes/<name>/glossary.md` が存在する状態で archive を実行する
- **THEN** glossary.md の全エントリが `_glossary.yaml` にマージされ、glossary.md が削除される

#### Scenario: glossary.md が存在しない場合はスキップされる
- **WHEN** `.modscape/changes/<name>/glossary.md` が存在しない状態で archive を実行する
- **THEN** glossary マージステップはスキップされ、エラーを出さずに続行する

#### Scenario: 既登録の用語は definition を上書きしない
- **WHEN** `_glossary.yaml` に既に登録されている用語が glossary.md にも存在する
- **THEN** `change` フィールドのみ更新され、`definition` は元の値を保持する

---

## ADDED Requirements

### Requirement: Coverage Policy 設定時に archive の merge 前にカバレッジゲートを実行する

`modscape:spec:archive` スキルは、`.modscape/modscape-spec.custom.md` に Coverage Policy（最小カバレッジ閾値）が設定されている場合、`modscape validate` の直後・merge の前に `modscape coverage` を実行しなければならない（SHALL）。

Coverage Policy が設定されていない場合、カバレッジチェックをスキップしなければならない（SHALL）。既存プロジェクトへの影響はゼロでなければならない（SHALL）。

カバレッジが閾値を下回る場合は警告を表示し、ユーザーに y/N で続行を確認しなければならない（SHALL）。ユーザーが N を選択した場合は merge をキャンセルしなければならない（SHALL）。ブロックではなく確認であるため、ユーザーが y を選択すれば閾値未満でも merge を続行できなければならない（SHALL）。

#### Scenario: Coverage Policy 設定時に閾値以上でそのまま続行する
- **WHEN** Coverage Policy が 70% に設定されており、spec-model.yaml の総合カバレッジが 75% の場合に archive を実行する
- **THEN** 「Coverage OK: 75% >= 70%」と表示されて merge ステップに進む

#### Scenario: Coverage Policy 設定時に閾値未満で確認を求める
- **WHEN** Coverage Policy が 70% に設定されており、spec-model.yaml の総合カバレッジが 45% の場合に archive を実行する
- **THEN** 「⚠ Coverage: 45% < 70% (threshold). Proceed anyway? (y/N)」と表示されてユーザーの入力を待つ

#### Scenario: 閾値未満でユーザーが y を選択して続行する
- **WHEN** カバレッジが閾値未満の状態で確認プロンプトに y を入力する
- **THEN** 警告を記録した上で merge ステップに進む

#### Scenario: 閾値未満でユーザーが N を選択してキャンセルする
- **WHEN** カバレッジが閾値未満の状態で確認プロンプトに N を入力する
- **THEN** 「Archive cancelled.」を表示して処理を終了し、main YAML への変更は行わない

#### Scenario: Coverage Policy が未設定の場合にスキップする
- **WHEN** `.modscape/modscape-spec.custom.md` に Coverage Policy が記述されていない状態で archive を実行する
- **THEN** カバレッジチェックをスキップして通常の validate → merge の流れで処理する
