## ADDED Requirements

### Requirement: ビジネス要件を対話的に収集して spec.md を生成する
AIスキル `/modscape:sdd:requirements` は、ユーザーとの対話を通じてビジネス要件を収集し、`.modscape/sdd/spec.md` を生成または更新しなければならない（SHALL）。

スキルは以下の項目を対話的に収集しなければならない（SHALL）:
- パイプラインのゴール（誰のために・何のために）
- ステークホルダー（owner / consumers）
- データソース（既存テーブルや外部システム）
- 受け入れ条件（Acceptance Criteria）
- ターゲットツール（dbt / SQLMesh / Spark SQL / plain SQL）

スキルは `.modscape/sdd/sdd.custom.md` が存在する場合、そのルールを優先して適用しなければならない（SHALL）。

#### Scenario: spec.md が存在しない場合に新規作成する
- **WHEN** `.modscape/sdd/spec.md` が存在しない状態で `/modscape:sdd:requirements` を実行する
- **THEN** AIは対話的に要件を収集し、所定のフォーマットで `.modscape/sdd/spec.md` を新規作成する

#### Scenario: spec.md が既存の場合に内容を確認して更新する
- **WHEN** `.modscape/sdd/spec.md` が既存の状態で `/modscape:sdd:requirements` を実行する
- **THEN** AIは既存内容を表示し、ユーザーの指示に基づいて更新する

#### Scenario: 完了後に次スキルへ誘導する
- **WHEN** spec.md の生成が完了する
- **THEN** AIは「設計に進みますか？ `/modscape:sdd:design` を実行してください」というメッセージを表示する
