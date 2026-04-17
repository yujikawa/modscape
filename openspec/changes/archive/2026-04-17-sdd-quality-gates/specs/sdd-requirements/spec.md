## MODIFIED Requirements

### Requirement: ビジネス要件を対話的に収集して spec.md を生成する
AIスキル `/modscape:spec:requirements` は、ユーザーとの対話を通じてビジネス要件を収集し、`.modscape/changes/<name>/spec.md` を生成または更新しなければならない（SHALL）。

スキルは以下の項目を対話的に収集しなければならない（SHALL）:
- パイプラインのゴール（誰のために・何のために）
- ステークホルダー（owner / consumers）
- データソース（既存テーブルや外部システム）
- 受け入れ条件（Acceptance Criteria）
- ターゲットツール（dbt / SQLMesh / Spark SQL / plain SQL）

スキルは受け入れ条件を生成する際、各条件に連番 ID（`AC-001`, `AC-002`, ...）を付与しなければならない（SHALL）。ユーザーが自由記述で条件を述べた場合も、スキルが ID を付与して整形しなければならない（SHALL）。

スキルは要件収集後に作業フォルダ名（kebab-case）を提案し、ユーザーの承認またはリネームを受けてから `changes/<name>/` フォルダを作成しなければならない（SHALL）。

スキルは `.modscape/changes/modscape-spec.custom.md` が存在する場合、そのルールを優先して適用しなければならない（SHALL）。

スキルは対話中に人間の調査なしに判断できない事項（例：データソースのオーナーが不明、SLAが未確認）を検知した場合、`.modscape/changes/<name>/questions.md` に質問を追記しなければならない（SHALL）。

#### Scenario: spec.md が存在しない場合にフォルダ名を提案して新規作成する
- **WHEN** 対応する `changes/<name>/spec.md` が存在しない状態で `/modscape:spec:requirements` を実行する
- **THEN** AIは対話的に要件を収集し、要件内容からkebab-caseのフォルダ名を提案してユーザーの確認を得た後、`changes/<name>/spec.md` を新規作成する

#### Scenario: 既存フォルダ名が衝突する場合に警告する
- **WHEN** AIが提案したフォルダ名と同名の `changes/<name>/` が既に存在する
- **THEN** AIは「`changes/<name>/` は既に存在します。別の名前を指定してください」と案内する

#### Scenario: spec.md が既存の場合に内容を確認して更新する
- **WHEN** `changes/<name>/spec.md` が既存の状態で `/modscape:spec:requirements <name>` を実行する
- **THEN** AIは既存内容を表示し、ユーザーの指示に基づいて更新する

#### Scenario: 受け入れ条件に AC-NNN ID を付与して生成する
- **WHEN** ユーザーが受け入れ条件を述べる
- **THEN** スキルは各条件に `AC-001:`, `AC-002:` ... の形式で連番 ID を付与して `spec.md` の `## Acceptance Criteria` セクションに記録する
