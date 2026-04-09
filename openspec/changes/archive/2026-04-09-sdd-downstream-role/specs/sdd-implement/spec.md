## MODIFIED Requirements

### Requirement: tasks.md の未完了タスクを順に実装する
AIスキル `/modscape:spec:implement <name>` は `.modscape/changes/<name>/tasks.md` の未完了タスク（`- [ ]`）を Phase 順に1つずつ実装し、完了したタスクのチェックボックスを更新しなければならない（SHALL）。

スキルは以下を実行しなければならない（SHALL）:
- `.modscape/codegen-rules.md`・`.modscape/changes/modscape-spec.custom.md`（存在する場合）を読み込む
- `changes/<name>/design.md` が存在する場合、`### Downstream Impact — Context Only` セクションのテーブル ID をスキップリストとして抽出する
- `changes/<name>/spec-model.yaml`（作業用YAML）の対象テーブル定義を参照してコードを生成する
- スキップリストに含まれるテーブルの実装タスクをスキップし、「⏭️ Skipping `<id>` (Context Only)」とメッセージを出力する
- タスク完了後に `changes/<name>/tasks.md` の該当行を `- [x]` に更新する
- 1タスク完了後に「次のタスクに進みますか？」と確認してから次へ進む

スキルは `.modscape/changes/modscape-spec.custom.md` が存在する場合、ターゲットツールや出力フォーマットについてそのルールを優先して適用しなければならない（SHALL）。

#### Scenario: 未完了タスクを順に実装する
- **WHEN** `changes/<name>/tasks.md` に未完了タスクが存在する状態で `/modscape:spec:implement <name>` を実行する
- **THEN** AIは `changes/<name>/spec-model.yaml` を参照して最初の未完了タスクのコードを生成し、tasks.md のチェックボックスを更新して次タスクへの確認を行う

#### Scenario: Context Only テーブルの実装をスキップする
- **WHEN** `design.md` の `### Downstream Impact — Context Only` に列挙されているテーブルのタスクが存在する
- **THEN** AIは「⏭️ Skipping `<id>` (Context Only)」とメッセージを出力してそのタスクをスキップし、次のタスクへ進む

#### Scenario: design.md が存在しない場合に全テーブルを実装対象とする
- **WHEN** `changes/<name>/design.md` が存在しない状態で `/modscape:spec:implement <name>` を実行する
- **THEN** AIはスキップリストなしで全テーブルを実装対象として処理する（後退互換）

#### Scenario: すべてのタスクが完了している場合にメッセージを表示する
- **WHEN** `changes/<name>/tasks.md` の全タスクが完了済み（`- [x]`）の状態で `/modscape:spec:implement <name>` を実行する
- **THEN** AIは「すべてのタスクが完了しています。`/modscape:spec:archive <name>` を実行してspecを同期してください」と案内する

#### Scenario: tasks.md が存在しない場合に案内メッセージを表示する
- **WHEN** `.modscape/changes/<name>/tasks.md` が存在しない状態で `/modscape:spec:implement <name>` を実行する
- **THEN** AIは「先に `/modscape:spec:design <name>` を実行してタスクリストを生成してください」と案内する
