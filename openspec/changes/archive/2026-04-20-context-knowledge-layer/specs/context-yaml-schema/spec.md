## ADDED Requirements

### Requirement: _context.yamlはプロジェクト横断の暗黙知のみを保持する

`_context.yaml`はSDD（Spec-Driven Development）のやり取りで生まれるプロジェクト横断の暗黙知を格納するファイルとする。スキーマ情報（テーブルの存在・カラム定義）はmodel.yamlが持つため、`_context.yaml`には含めてはならない。per-tableの暗黙知はspecs/<table-id>/spec.mdおよびquestions.mdに任せる。

有効なフィールド:
- `decisions`: プロジェクト全体に関わる設計判断・合意した慣習
  - `id` (必須): D-NNN形式
  - `summary` (必須): 判断内容の要約
  - `rationale` (任意): なぜその判断をしたか
  - `date` (任意): YYYY-MM-DD
  - `change` (任意): 生まれたchange名
- `questions`: SDD会話で生まれたQ&A
  - `id` (必須): Q-NNN形式
  - `question` (必須): 問いの内容
  - `answer` (任意): 回答。存在すれば回答済み、なければ未回答
  - `date` (任意): YYYY-MM-DD
  - `change` (任意): 生まれたchange名

廃止フィールド: `tables.*`（last_change, has_spec, open_questions）、`decisions[].affects`

#### Scenario: decisionsのみのファイルが有効
- **WHEN** `_context.yaml`が`decisions`セクションのみを持つ
- **THEN** パース・表示が正常に動作する

#### Scenario: questionsに回答済みと未回答が混在する
- **WHEN** `questions`リストに`answer`フィールドを持つ項目と持たない項目が混在する
- **THEN** 両方とも正常にパースされ、answerの有無で回答状態が判別できる

#### Scenario: 空のファイル（テンプレート）が有効
- **WHEN** `_context.yaml`が`decisions: []`と`questions: []`のみを含む
- **THEN** パースエラーにならず空の状態として扱われる

---

### Requirement: `spec new`実行時に`_context.yaml`の空テンプレートを自動生成する

`modscape spec new <name>`を実行したとき、`.modscape/specs/_context.yaml`が存在しない場合に限り、空テンプレートを自動生成する。既存ファイルがある場合は上書きしない。

テンプレートの内容:
```yaml
# .modscape/specs/_context.yaml
# Cross-project tacit knowledge from SDD interactions.
# Do NOT store schema info here — that belongs in model.yaml.
# Per-table knowledge belongs in specs/<table-id>/spec.md and questions.md.

decisions: []

questions: []
```

#### Scenario: 初回spec new実行時に_context.yamlが生成される
- **WHEN** `.modscape/specs/_context.yaml`が存在しない状態で`modscape spec new <name>`を実行する
- **THEN** `.modscape/specs/_context.yaml`が空テンプレートとして生成される

#### Scenario: 既存の_context.yamlは上書きされない
- **WHEN** `.modscape/specs/_context.yaml`が既に存在する状態で`modscape spec new <name>`を実行する
- **THEN** 既存の`_context.yaml`は変更されない
