## MODIFIED Requirements

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

既存の `specs/<table-id>.md`（旧フラットファイル形式）が存在する場合、`specs/<table-id>/spec.md` に移動してから処理を継続しなければならない（SHALL）。

#### Scenario: マージ前に dry-run サマリーを表示して確認を取る
- **WHEN** `/modscape:spec:archive <name>` を実行する
- **THEN** 「Tables to add / Tables to update（変更カラム）/ No changes」の ID 単位サマリーが表示され、確認が求められる

#### Scenario: ユーザーが確認を拒否した場合にマージをスキップする
- **WHEN** dry-run サマリー確認で N または拒否を選択する
- **THEN** マージは実行されず「Archive cancelled.」と表示して終了する

#### Scenario: 作業用YAMLを本番YAMLにマージする
- **WHEN** dry-run サマリー確認で承認する
- **THEN** `modscape merge` が実行され、spec版が優先してマージされる

#### Scenario: Direct Impact テーブルの spec をテーブルディレクトリに生成する
- **WHEN** archive を実行し、テーブルが `### Direct Impact` に分類されている
- **THEN** `.modscape/specs/<table-id>/spec.md` が生成・更新され、`.modscape/specs/<table-id>/questions.md` も同期される

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

#### Scenario: archive サマリーに AC カバレッジを含める
- **WHEN** `/modscape:spec:archive <name>` が完了する
- **THEN** サマリーに「テスト紐付き AC: N 件 / 手動検証: N 件 / 未カバー: N 件」が表示される

#### Scenario: 同期完了後に作業フォルダをアーカイブする
- **WHEN** マージとすべての同期が完了する
- **THEN** `.modscape/changes/<name>/` が `.modscape/archives/YYYY-MM-DD-<name>/` に移動される
