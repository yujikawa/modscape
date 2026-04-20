## MODIFIED Requirements

### Requirement: context export が _questions.yaml を出力に含める
`modscape context export` コマンドの出力に `_questions.yaml` のデータを含める。`_context.yaml` の questions セクションは参照しない。

#### Scenario: JSON 出力に questions フィールドが含まれる
- **WHEN** `modscape context export --format json` を実行する
- **THEN** 出力 JSON に `questions` フィールドが含まれ、`_questions.yaml` の内容が反映される

#### Scenario: Markdown 出力に Q&A セクションが含まれる
- **WHEN** `modscape context export --format markdown` を実行する（またはデフォルト出力）
- **THEN** `## Q&A` セクションが `_questions.yaml` のエントリで構成される

#### Scenario: _questions.yaml が存在しない場合は空リスト
- **WHEN** `_questions.yaml` が存在しない状態で context export を実行する
- **THEN** questions フィールドは空配列になり、エラーにならない
