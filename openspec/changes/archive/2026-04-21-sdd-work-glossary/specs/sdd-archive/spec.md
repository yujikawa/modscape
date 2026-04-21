## ADDED Requirements

### Requirement: archive 時に glossary.md を _glossary.yaml にマージする
`archive` スキルは `.modscape/changes/<name>/glossary.md` が存在する場合、その内容を `.modscape/specs/_glossary.yaml` にマージしなければならない（SHALL）。マージ後、`glossary.md` を削除しなければならない（SHALL）。

マージ戦略：
- `id` で既存エントリを照合する
- 未登録の場合 → `_glossary.yaml` の `terms:` に新規追加する
- 既登録の場合 → `change` フィールドのみ更新し、`definition` は上書きしない（手動編集を保護する）
- `_glossary.yaml` が存在しない場合 → 新規作成してマージする

#### Scenario: glossary.md が存在する場合にマージが実行される
- **WHEN** `.modscape/changes/<name>/glossary.md` が存在する状態で archive を実行する
- **THEN** glossary.md の全エントリが `_glossary.yaml` にマージされ、glossary.md が削除される

#### Scenario: glossary.md が存在しない場合はスキップされる
- **WHEN** `.modscape/changes/<name>/glossary.md` が存在しない状態で archive を実行する
- **THEN** glossary マージステップはスキップされ、エラーを出さずに続行する

#### Scenario: 既登録の用語は definition を上書きしない
- **WHEN** `_glossary.yaml` に既に登録されている用語が glossary.md にも存在する
- **THEN** `change` フィールドのみ更新され、`definition` は元の値を保持する
