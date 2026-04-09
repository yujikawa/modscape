## MODIFIED Requirements

### Requirement: spec.md と既存specを読み込んで model.yaml を設計する
AIスキル `/modscape:spec:design <name>` は `changes/<name>/spec.md`・`specs/*.md`（既存の恒久テーブルspec）を読み込み、影響テーブルを自動特定して `changes/<name>/model.yaml`（作業用YAML）を設計・更新しなければならない（SHALL）。本番のmodel.yaml（HR.yaml等）は直接変更してはならない（SHALL NOT）。

スキルは以下を実行しなければならない（SHALL）:
- `.modscape/rules.md`・`.modscape/changes/modscape-spec.custom.md`（存在する場合）・`specs/*.md`（存在する場合）を読み込む
- `spec.md` の Data Sources をもとに関連テーブルを自動判定し、`modscape extract <master>.yaml --tables <ids> --with-downstream` で `changes/<name>/model.yaml` を生成する（Downstream Impact のテーブルも自動包含）
- 新規テーブルを `changes/<name>/model.yaml` に追加設計する（mutation CLIの対象は `changes/<name>/model.yaml`）
- 設計判断と影響テーブルリストを `changes/<name>/design.md` に記録する
- 設計完了後に `modscape layout changes/<name>/model.yaml` でレイアウトを更新する

スキルは再実行可能でなければならず（SHALL）、再実行時は以下を行わなければならない（SHALL）:
- 既存の `changes/<name>/design.md` の気づきセクションを読み込み設計に反映する
- `changes/<name>/tasks.md` の完了済みタスク（`- [x]`）を保持したまま未完了部分を差分更新する

スキルは `.modscape/changes/modscape-spec.custom.md` が存在する場合、そのルールを優先して適用しなければならない（SHALL）。

スキルは `changes/<name>/model.yaml` の `lineage` セクションをトポロジカルソートし、実装フェーズごとに分類した `changes/<name>/tasks.md` を生成しなければならない（SHALL）。

タスクは以下のフェーズ構成で分類しなければならない（SHALL）:
- Phase 1: Staging（依存なしのテーブル）
- Phase 2: Core（1段上流のテーブル）
- Phase 3: Mart / 集計（最下流のテーブル）
- Phase 4: Tests（各テーブルのキーカラムに対するテスト）

各タスクには以下を含めなければならない（SHALL）:
- テーブルID（バッククォートで表記）
- materialization 種別（`implementation.materialization` または `appearance.type` から推定）
- 上流依存テーブル（`←` で表記）

#### Scenario: spec.md のData Sourcesから関連テーブルを抽出して作業用YAMLを生成する
- **WHEN** `changes/<name>/spec.md` が存在し `/modscape:spec:design <name>` を実行する
- **THEN** AIはData Sourcesを読み、`modscape extract --with-downstream`で関連テーブルおよびその下流（Downstream Impact）を抽出して `changes/<name>/model.yaml` を生成する

#### Scenario: 本番YAMLを変更しない
- **WHEN** `/modscape:spec:design <name>` を実行する
- **THEN** 本番のmaster model.yaml（HR.yaml等）は一切変更されない

#### Scenario: design.md の気づきを反映して再実行する
- **WHEN** `changes/<name>/design.md` に気づきが追記された状態で `/modscape:spec:design <name>` を再実行する
- **THEN** AIは気づきの内容を読み込んで `changes/<name>/model.yaml` の設計を更新し、tasks.md の完了済みタスクを保持したまま未完了部分を差分更新する

#### Scenario: spec.md が存在しない場合にエラーメッセージを表示する
- **WHEN** `changes/<name>/spec.md` が存在しない状態で `/modscape:spec:design <name>` を実行する
- **THEN** AIは「先に `/modscape:spec:requirements` を実行して spec.md を作成してください」と案内する

#### Scenario: 完了後に次スキルへ誘導する
- **WHEN** `changes/<name>/model.yaml` の更新が完了する
- **THEN** AIは「実装を始めますか？ `/modscape:spec:implement <name>` を実行してください」というメッセージを表示する
