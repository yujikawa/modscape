## MODIFIED Requirements

### Requirement: spec.md と既存specを読み込んで spec-model.yaml を設計する
AIスキル `/modscape:spec:design <name>` は `changes/<name>/spec.md`・`specs/*.md`（既存の恒久テーブルspec）を読み込み、影響テーブルを自動特定して `changes/<name>/spec-model.yaml`（作業用YAML）を設計・更新しなければならない（SHALL）。本番のmodel.yaml（HR.yaml等）は直接変更してはならない（SHALL NOT）。

スキルは以下を実行しなければならない（SHALL）:
- `.modscape/rules.md`・`.modscape/changes/modscape-spec.custom.md`（存在する場合）・`specs/*.md`（存在する場合）を読み込む
- `spec.md` の Data Sources をもとに修正対象テーブルIDを特定し、`spec-config.yaml` の全 `master_yamls[].path` を入力として `modscape extract ... --with-downstream` で `changes/<name>/spec-model.yaml` を生成する（初回のみ）
- 新規テーブルを `changes/<name>/spec-model.yaml` に追加設計する（mutation CLIの対象は `changes/<name>/spec-model.yaml`）
- 設計判断と影響テーブルリストを `changes/<name>/design.md` に記録する
  - `--tables` で指定したID → `### Direct Impact`
  - `--with-downstream` で追加収集されたIDのうち、今回の変更で修正が必要なもの → `### Downstream Impact — Implement`
  - `--with-downstream` で追加収集されたIDのうち、参照・確認のみで修正不要なもの → `### Downstream Impact — Context Only`
- `design.md` の冒頭に「この Affected Tables 分類は AI の提案です。内容が異なる場合は直接編集してください」と注記を入れる
- 設計完了後に `modscape validate changes/<name>/spec-model.yaml` で検証する

スキルは再実行可能でなければならず（SHALL）、再実行時は以下を行わなければならない（SHALL）:
- 既存の `changes/<name>/design.md` の気づきセクションを読み込み設計に反映する
- `changes/<name>/tasks.md` の完了済みタスク（`- [x]`）を保持したまま未完了部分を差分更新する

スキルは `.modscape/changes/modscape-spec.custom.md` が存在する場合、そのルールを優先して適用しなければならない（SHALL）。

スキルは `changes/<name>/spec-model.yaml` の `lineage` セクションをトポロジカルソートし、実装フェーズごとに分類した `changes/<name>/tasks.md` を生成しなければならない（SHALL）。tasks.md に含めるテーブルは Direct Impact と Downstream Impact — Implement のみとし、Context Only テーブルは除外しなければならない（SHALL）。

タスクは以下のフェーズ構成で分類しなければならない（SHALL）:
- Phase 1: Staging（依存なしのテーブル）
- Phase 2: Core（1段上流のテーブル）
- Phase 3: Mart / 集計（最下流のテーブル）
- Phase 4: Tests（各テーブルのキーカラムに対するテスト）

各タスクには以下を含めなければならない（SHALL）:
- テーブルID（バッククォートで表記）
- materialization 種別（`implementation.materialization` または `appearance.type` から推定）
- 上流依存テーブル（`←` で表記）

#### Scenario: Downstream Impact を Implement と Context Only に分類する
- **WHEN** `--with-downstream` で下流テーブルが収集された状態で `/modscape:spec:design <name>` を実行する
- **THEN** AIは各下流テーブルを分析し、`### Downstream Impact — Implement` と `### Downstream Impact — Context Only` に分類して `design.md` に記録する
- **THEN** `design.md` の先頭に「この分類は AI の提案です。変更が必要な場合は直接編集してください」という注記が含まれる

#### Scenario: Context Only テーブルを tasks.md から除外する
- **WHEN** `design.md` に `### Downstream Impact — Context Only` のテーブルが存在する
- **THEN** 生成される `tasks.md` にそれらのテーブルのタスクは含まれない

#### Scenario: 修正対象テーブルと全下流テーブルを抽出して作業用YAMLを生成する
- **WHEN** `changes/<name>/spec.md` が存在し `/modscape:spec:design <name>` を初回実行する
- **THEN** AIは Data Sources から修正対象テーブルIDを特定し、`spec-config.yaml` の全 master YAML を入力として `modscape extract ... --with-downstream` を実行し、修正対象テーブルとその全下流テーブルを含む `changes/<name>/spec-model.yaml` を生成する

#### Scenario: 本番YAMLを変更しない
- **WHEN** `/modscape:spec:design <name>` を実行する
- **THEN** 本番のmaster model.yaml（HR.yaml等）は一切変更されない

#### Scenario: design.md の気づきを反映して再実行する
- **WHEN** `changes/<name>/design.md` に気づきが追記された状態で `/modscape:spec:design <name>` を再実行する
- **THEN** AIは気づきの内容を読み込んで `changes/<name>/spec-model.yaml` の設計を更新し、tasks.md の完了済みタスクを保持したまま未完了部分を差分更新する

#### Scenario: spec.md が存在しない場合にエラーメッセージを表示する
- **WHEN** `changes/<name>/spec.md` が存在しない状態で `/modscape:spec:design <name>` を実行する
- **THEN** AIは「先に `/modscape:spec:requirements` を実行して spec.md を作成してください」と案内する

#### Scenario: 完了後に次スキルへ誘導する
- **WHEN** `changes/<name>/spec-model.yaml` の更新が完了する
- **THEN** AIは「実装を始めますか？ `/modscape:spec:implement <name>` を実行してください」というメッセージを表示する
