## MODIFIED Requirements

### Requirement: ビジネス要件を対話的に収集して spec.md を生成する
AIスキル `/modscape:spec:requirements` は、ユーザーとの対話を通じてビジネス要件を収集し、`.modscape/changes/<name>/spec.md` を生成または更新しなければならない（SHALL）。

スキルは以下の項目を対話的に収集しなければならない（SHALL）:
- パイプラインのゴール（誰のために・何のために）
- ステークホルダー（owner / consumers）
- データソース（既存テーブルや外部システム）
- 抽象的な受け入れ条件（Acceptance Criteria）
- ターゲットツール（dbt / SQLMesh / Spark SQL / plain SQL）

**spec.md フォーマットの制約:**
スキルが生成する `spec.md` は以下の構成に限定しなければならない（SHALL）。検証方法・詳細SQL・変換式・WHEN/THEN シナリオは `spec.md` に含めてはならない（SHALL NOT）。それらは `design.md` の責務とする。

```markdown
## Background
なぜこの変更が必要か（動機・背景）

## Acceptance Criteria
- AC-001: <何が満たされるべきかを抽象的に記述>
- AC-002: ...
```

受け入れ条件は「何が満たされるべきか」を述べるものとし、「どう確認するか」は書いてはならない（SHALL NOT）。

スキルは受け入れ条件を生成する際、各条件に連番 ID（`AC-001`, `AC-002`, ...）を付与しなければならない（SHALL）。

スキルは要件収集後に作業フォルダ名（kebab-case）を提案し、ユーザーの承認またはリネームを受けてから `changes/<name>/` フォルダを作成しなければならない（SHALL）。

スキルは `.modscape/changes/modscape-spec.custom.md` が存在する場合、そのルールを優先して適用しなければならない（SHALL）。

スキルは対話中に判断できない事項を検知した場合、`.modscape/changes/<name>/questions.md` に質問を追記しなければならない（SHALL）。

#### Scenario: spec.md が存在しない場合にフォルダ名を提案して新規作成する
- **WHEN** 対応する `changes/<name>/spec.md` が存在しない状態で `/modscape:spec:requirements` を実行する
- **THEN** AIは対話的に要件を収集し、kebab-case のフォルダ名を提案してユーザーの確認を得た後、Background と Acceptance Criteria のみを含む `spec.md` を新規作成する

#### Scenario: 受け入れ条件に AC-NNN ID を付与して生成する
- **WHEN** ユーザーが受け入れ条件を述べる
- **THEN** スキルは各条件に `AC-001:`, `AC-002:` の形式で連番 ID を付与し、抽象的な条件のみを `## Acceptance Criteria` セクションに記録する。検証方法や SQL は含めない

#### Scenario: 検証方法を spec.md に書こうとしたら design.md に誘導する
- **WHEN** ユーザーが「SELECT COUNT(*) で0件であること」のような検証 SQL を spec.md に記載しようとする
- **THEN** スキルは「検証方法の詳細は design.md に記載します。spec.md には抽象的な受け入れ条件のみを記録します」と伝えて spec.md への記載を省略する

#### Scenario: 既存 spec.md が存在する場合に内容を確認して更新する
- **WHEN** `changes/<name>/spec.md` が既存の状態で `/modscape:spec:requirements <name>` を実行する
- **THEN** AIは既存内容を表示し、ユーザーの指示に基づいて更新する
