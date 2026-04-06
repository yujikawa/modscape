## MODIFIED Requirements

### Requirement: spec.md と既存specを読み込んで model.yaml を設計する
AIスキル `/modscape:sdd:design <name>` は `sdd/<name>/spec.md`・`model.yaml`・`specs/*.md`（既存の恒久テーブルspec）を読み込み、影響テーブルを自動特定して `model.yaml` を設計・更新しなければならない（SHALL）。

スキルは以下を実行しなければならない（SHALL）:
- `.modscape/rules.md`・`.modscape/sdd/sdd.custom.md`（存在する場合）・`specs/*.md`（存在する場合）を読み込む
- `spec.md` の Goal / Data Sources / Acceptance Criteria と `model.yaml` の lineage をもとに影響テーブルを自動特定する（新規作成・更新・間接影響）
- mutation CLI コマンド（`modscape table add` 等）を優先して使用し、YAML を直接編集するのは複雑なフィールドのみとする
- 設計判断と影響テーブルリストを `sdd/<name>/design.md` に記録する
- 設計完了後に `modscape layout model.yaml` でレイアウトを更新する

スキルは再実行可能でなければならず（SHALL）、再実行時は以下を行わなければならない（SHALL）:
- 既存の `sdd/<name>/design.md` の気づきセクションを読み込み設計に反映する
- `sdd/<name>/tasks.md` の完了済みタスク（`- [x]`）を保持したまま未完了部分を差分更新する

スキルは `.modscape/sdd/sdd.custom.md` が存在する場合、そのルールを優先して適用しなければならない（SHALL）。

#### Scenario: spec.md をもとに model.yaml を新規設計する
- **WHEN** `sdd/<name>/spec.md` が存在し `/modscape:sdd:design <name>` を実行する
- **THEN** AIは spec.md・model.yaml・specs/*.md を読み込み、テーブル・lineage・domains の構成を設計して model.yaml に反映し、設計判断を design.md に記録する

#### Scenario: 影響テーブルを自動特定して記録する
- **WHEN** `/modscape:sdd:design <name>` の設計が完了する
- **THEN** AIは直接影響テーブルと間接影響テーブルを `sdd/<name>/design.md` に記録する

#### Scenario: design.md の気づきを反映して再実行する
- **WHEN** `sdd/<name>/design.md` に気づきが追記された状態で `/modscape:sdd:design <name>` を再実行する
- **THEN** AIは気づきの内容を読み込んで設計を更新し、tasks.md の完了済みタスクを保持したまま未完了部分を差分更新する

#### Scenario: spec.md が存在しない場合にエラーメッセージを表示する
- **WHEN** `sdd/<name>/spec.md` が存在しない状態で `/modscape:sdd:design <name>` を実行する
- **THEN** AIは「先に `/modscape:sdd:requirements` を実行して spec.md を作成してください」と案内する

#### Scenario: 完了後に次スキルへ誘導する
- **WHEN** model.yaml の更新が完了する
- **THEN** AIは「実装を始めますか？ `/modscape:sdd:implement <name>` を実行してください」というメッセージを表示する
