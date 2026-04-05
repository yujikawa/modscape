## ADDED Requirements

### Requirement: tasks.md の未完了タスクを順に実装する
AIスキル `/modscape:sdd:implement` は `.modscape/sdd/tasks.md` の未完了タスク（`- [ ]`）を Phase 順に1つずつ実装し、完了したタスクのチェックボックスを更新しなければならない（SHALL）。

スキルは以下を実行しなければならない（SHALL）:
- `.modscape/codegen-rules.md` および `.modscape/sdd/sdd.custom.md`（存在する場合）を読み込む
- `model.yaml` の対象テーブル定義を参照してコードを生成する
- タスク完了後に tasks.md の該当行を `- [x]` に更新する
- 1タスク完了後に「次のタスクに進みますか？」と確認してから次へ進む

スキルは `.modscape/sdd/sdd.custom.md` が存在する場合、ターゲットツールや出力フォーマットについてそのルールを優先して適用しなければならない（SHALL）。

#### Scenario: 未完了タスクを順に実装する
- **WHEN** tasks.md に未完了タスクが存在する状態で `/modscape:sdd:implement` を実行する
- **THEN** AIは最初の未完了タスクのコードを生成し、tasks.md のチェックボックスを更新して次タスクへの確認を行う

#### Scenario: すべてのタスクが完了している場合にメッセージを表示する
- **WHEN** tasks.md の全タスクが完了済み（`- [x]`）の状態で `/modscape:sdd:implement` を実行する
- **THEN** AIは「すべてのタスクが完了しています。spec.md の Status を `done` に更新してください」と案内する

#### Scenario: tasks.md が存在しない場合に案内メッセージを表示する
- **WHEN** `.modscape/sdd/tasks.md` が存在しない状態で `/modscape:sdd:implement` を実行する
- **THEN** AIは「先に `/modscape:sdd:tasks` を実行してタスクリストを生成してください」と案内する
