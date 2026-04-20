## ADDED Requirements

### Requirement: spec:requirements スキルが _questions.yaml に書き込む
`spec:requirements` 実行後、未解決事項を `_questions.yaml` に直接追記する。`questions.md` への書き込みは行わない。

#### Scenario: 未解決事項が _questions.yaml に追記される
- **WHEN** `spec:requirements` が質問を生成する
- **THEN** `.modscape/specs/_questions.yaml` の `questions:` リストに status: open のエントリが追加される

#### Scenario: ID が連番で採番される
- **WHEN** 既存エントリの最大 ID が Q-003 の状態で新規追加する
- **THEN** 新エントリの ID は Q-004 となる

### Requirement: spec:answer スキルが _questions.yaml を更新する
`spec:answer` はリストアップ・回答記録の対象を `_questions.yaml` に変更する。

#### Scenario: open エントリの一覧表示
- **WHEN** `spec:answer` を ID 未指定で呼び出す
- **THEN** `_questions.yaml` から status: open のエントリを一覧表示する

#### Scenario: 回答が記録される
- **WHEN** ユーザーが明確な回答を提供する
- **THEN** 対象エントリの answer フィールドに回答が書き込まれ、status が answered に更新される

#### Scenario: 前提として記録される
- **WHEN** ユーザーが「わからない」「TBD」と回答する
- **THEN** assumption フィールドに前提内容が記録され、status が assumed に更新される

### Requirement: spec:archive が questions.md を _questions.yaml にマージする
アーカイブ時に `questions.md` のエントリを `_questions.yaml` に追記し、`questions.md` を削除する。

#### Scenario: questions.md が存在する場合にマージされる
- **WHEN** `spec:archive` を実行し、change に `questions.md` が存在する
- **THEN** `questions.md` の全エントリが `_questions.yaml` に追記される

#### Scenario: マージ後 questions.md が削除される
- **WHEN** マージが正常に完了する
- **THEN** `.modscape/changes/<name>/questions.md` が削除される

#### Scenario: questions.md が存在しない場合はスキップ
- **WHEN** `spec:archive` を実行し、change に `questions.md` が存在しない
- **THEN** マージステップはスキップされる
