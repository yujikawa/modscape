## MODIFIED Requirements

### Requirement: _context.yaml は decisions のみを保持する
`_context.yaml` の `questions` セクションを削除し、`decisions` セクションのみを保持する構造に変更する。Q&A は `_questions.yaml` で一元管理する。

#### Scenario: _context.yaml に questions セクションが存在しない
- **WHEN** `_context.yaml` を読み込む
- **THEN** `questions` フィールドは存在せず、`decisions` のみが返される

#### Scenario: decisions の読み込みは従来通り機能する
- **WHEN** `_context.yaml` を parseContextYaml でパースする
- **THEN** decisions 配列が正しく返される
