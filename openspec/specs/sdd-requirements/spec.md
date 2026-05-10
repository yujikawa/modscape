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

#### Scenario: 要件収集中に不明な事項を questions.md に積む
- **WHEN** 対話中にAIがユーザーから回答を得られなかった事項がある
- **THEN** AIは `questions.md` に該当質問を追記し、仮定で進む場合は `**仮定:**` 行を付ける

#### Scenario: 受け入れ条件に AC-NNN ID を付与して生成する
- **WHEN** ユーザーが受け入れ条件を述べる
- **THEN** スキルは各条件に `AC-001:`, `AC-002:` ... の形式で連番 ID を付与して `spec.md` の `## Acceptance Criteria` セクションに記録する

#### Scenario: 完了後に次スキルへ誘導する
- **WHEN** spec.md の生成が完了する
- **THEN** AIは「設計に進みますか？ `/modscape:spec:design <name>` を実行してください」というメッセージを表示する

### Requirement: requirements フェーズで発見した用語を glossary.md に記録する
requirements スキルは会話で登場したプロジェクト固有のビジネス用語を `.modscape/changes/<name>/glossary.md` に記録しなければならない（SHALL）。従来の `_glossary.yaml` への直接書き込みは行ってはならない（SHALL NOT）。

用語の記録は requirements 完了後のステップとして実行し、`_glossary.yaml` が存在するかどうかに関わらず `glossary.md` に追記する。

#### Scenario: requirements 完了後に用語が glossary.md に記録される
- **WHEN** requirements スキルが完了し、会話にプロジェクト固有の用語が含まれていた
- **THEN** `.modscape/changes/<name>/glossary.md` に該当用語が追記される

#### Scenario: _glossary.yaml への直接書き込みは行わない
- **WHEN** requirements スキルが用語を記録する
- **THEN** `.modscape/specs/_glossary.yaml` は変更されない

### Requirement: requirementsコマンドのsaveヒント
`/modscape:spec:requirements` の出力末尾に、作業を中断する場合の save ヒントを表示しなければならない（SHALL）。

#### Scenario: requirements セッション終了時のsaveヒント表示
- **WHEN** `/modscape:spec:requirements <name>` の出力が完了する
- **THEN** 出力の末尾に「作業を中断する場合は `/modscape:spec:save <name>` を実行してください」というヒントを表示する
