## MODIFIED Requirements

### Requirement: ビジネス要件を対話的に収集して spec.md を生成する
AIスキル `/modscape:spec:requirements` は、ユーザーとの対話を通じてビジネス要件を収集し、`.modscape/changes/<name>/spec.md` を生成または更新しなければならない（SHALL）。

スキルは以下の項目を対話的に収集しなければならない（SHALL）:
- パイプラインのゴール（誰のために・何のために）
- ステークホルダー（owner / consumers）
- データソース（既存テーブルや外部システム）
- 受け入れ条件（Acceptance Criteria）
- ターゲットツール（dbt / SQLMesh / Spark SQL / plain SQL）

スキルは要件収集後に作業フォルダ名（kebab-case）を提案し、ユーザーの承認またはリネームを受けてから `changes/<name>/` フォルダを作成しなければならない（SHALL）。

スキルは `.modscape/changes/modscape-spec.custom.md` が存在する場合、そのルールを優先して適用しなければならない（SHALL）。

#### Scenario: spec.md が存在しない場合にフォルダ名を提案して新規作成する
- **WHEN** 対応する `changes/<name>/spec.md` が存在しない状態で `/modscape:spec:requirements` を実行する
- **THEN** AIは対話的に要件を収集し、要件内容からkebab-caseのフォルダ名を提案してユーザーの確認を得た後、`changes/<name>/spec.md` を新規作成する

#### Scenario: 既存フォルダ名が衝突する場合に警告する
- **WHEN** AIが提案したフォルダ名と同名の `changes/<name>/` が既に存在する
- **THEN** AIは「`changes/<name>/` は既に存在します。別の名前を指定してください」と案内する

#### Scenario: spec.md が既存の場合に内容を確認して更新する
- **WHEN** `changes/<name>/spec.md` が既存の状態で `/modscape:spec:requirements <name>` を実行する
- **THEN** AIは既存内容を表示し、ユーザーの指示に基づいて更新する

#### Scenario: 完了後に次スキルへ誘導する
- **WHEN** spec.md の生成が完了する
- **THEN** AIは「設計に進みますか？ `/modscape:spec:design <name>` を実行してください」というメッセージを表示する
