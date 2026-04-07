## ADDED Requirements

### Requirement: spec.md を読み込んで model.yaml を設計する
AIスキル `/modscape:sdd:design` は `.modscape/sdd/spec.md` を読み込み、modscape の mutation CLI を活用して `model.yaml` を提案・更新しなければならない（SHALL）。

スキルは以下を実行しなければならない（SHALL）:
- `.modscape/rules.md` および `.modscape/sdd/sdd.custom.md`（存在する場合）を読み込む
- spec.md の Goal / Data Sources / Acceptance Criteria をもとにテーブル・lineage・domains を設計する
- mutation CLI コマンド（`modscape table add` 等）を優先して使用し、YAML を直接編集するのは複雑なフィールドのみとする
- 設計完了後に `modscape layout model.yaml` でレイアウトを更新する

スキルは `.modscape/sdd/sdd.custom.md` が存在する場合、そのルールを優先して適用しなければならない（SHALL）。

#### Scenario: spec.md をもとに model.yaml を新規設計する
- **WHEN** spec.md が存在し `/modscape:sdd:design` を実行する
- **THEN** AIは spec.md の要件を読み込み、適切なテーブル・lineage・domains の構成を提案し model.yaml に反映する

#### Scenario: spec.md が存在しない場合にエラーメッセージを表示する
- **WHEN** `.modscape/sdd/spec.md` が存在しない状態で `/modscape:sdd:design` を実行する
- **THEN** AIは「先に `/modscape:sdd:requirements` を実行して spec.md を作成してください」と案内する

#### Scenario: 完了後に次スキルへ誘導する
- **WHEN** model.yaml の更新が完了する
- **THEN** AIは「タスクを生成しますか？ `/modscape:sdd:tasks` を実行してください」というメッセージを表示する
