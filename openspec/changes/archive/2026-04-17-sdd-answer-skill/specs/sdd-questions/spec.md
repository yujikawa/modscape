## MODIFIED Requirements

### Requirement: SDDワークフロー全体を通じたQ&A管理機能
`questions.md` の生成・更新・回答・archive sync を行う。

質問への回答は CLI コマンドではなく AI スキル `/modscape:spec:answer` を通じて行わなければならない（SHALL）。`modscape spec answer` CLI コマンドは廃止する（SHALL NOT use）。

その他の要件（質問の積み方・フォーマット・archive sync）は変更なし。

#### Scenario: questions.md への回答は AI スキルを通じて行う
- **WHEN** Q-NNN に回答したい
- **THEN** `/modscape:spec:answer <name> <id>` を実行する（`modscape spec answer` CLI は使用しない）
