## ADDED Requirements

### Requirement: ContextPanel の Q&A タブが _questions.yaml から読み込む
ContextPanel の Q&A タブのデータソースを `_context.yaml` の questions セクションから `_questions.yaml` に変更する。

#### Scenario: _questions.yaml の全エントリが表示される
- **WHEN** ContextPanel を開いて Q&A タブを選択する
- **THEN** `_questions.yaml` の全エントリがリスト表示される

#### Scenario: table フィールドによるラベル表示
- **WHEN** Q&A エントリに `table` フィールドが存在する
- **THEN** テーブル名がバッジとして表示される

#### Scenario: status による視覚的区別
- **WHEN** エントリの status が open / assumed / answered それぞれである
- **THEN** 異なるアイコンまたはバッジで状態が視覚的に区別される

#### Scenario: _questions.yaml が存在しない場合は空表示
- **WHEN** `_questions.yaml` が存在しない
- **THEN** Q&A タブに「Q&A なし」のメッセージが表示される
