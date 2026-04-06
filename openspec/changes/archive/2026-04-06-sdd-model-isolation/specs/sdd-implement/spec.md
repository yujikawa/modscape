## MODIFIED Requirements

### Requirement: tasks.md の未完了タスクを順に実装する
AIスキル `/modscape:sdd:implement <name>` は `.modscape/sdd/<name>/tasks.md` の未完了タスク（`- [ ]`）を Phase 順に1つずつ実装し、完了したタスクのチェックボックスを更新しなければならない（SHALL）。

スキルは以下を実行しなければならない（SHALL）:
- `.modscape/codegen-rules.md`・`.modscape/sdd/sdd.custom.md`（存在する場合）を読み込む
- `sdd/<name>/model.yaml`（作業用YAML）の対象テーブル定義を参照してコードを生成する
- タスク完了後に `sdd/<name>/tasks.md` の該当行を `- [x]` に更新する
- 1タスク完了後に「次のタスクに進みますか？」と確認してから次へ進む

スキルは `.modscape/sdd/sdd.custom.md` が存在する場合、ターゲットツールや出力フォーマットについてそのルールを優先して適用しなければならない（SHALL）。

#### Scenario: 未完了タスクを順に実装する
- **WHEN** `sdd/<name>/tasks.md` に未完了タスクが存在する状態で `/modscape:sdd:implement <name>` を実行する
- **THEN** AIは `sdd/<name>/model.yaml` を参照して最初の未完了タスクのコードを生成し、tasks.md のチェックボックスを更新して次タスクへの確認を行う

#### Scenario: すべてのタスクが完了している場合にメッセージを表示する
- **WHEN** `sdd/<name>/tasks.md` の全タスクが完了済み（`- [x]`）の状態で `/modscape:sdd:implement <name>` を実行する
- **THEN** AIは「すべてのタスクが完了しています。`/modscape:sdd:archive <name>` を実行してspecを同期してください」と案内する

#### Scenario: tasks.md が存在しない場合に案内メッセージを表示する
- **WHEN** `.modscape/sdd/<name>/tasks.md` が存在しない状態で `/modscape:sdd:implement <name>` を実行する
- **THEN** AIは「先に `/modscape:sdd:design <name>` を実行してタスクリストを生成してください」と案内する
