## MODIFIED Requirements

### Requirement: tasks.md の未完了タスクを順に実装する
AIスキル `/modscape:spec:implement <name>` は `.modscape/changes/<name>/tasks.md` の未完了タスク（`- [ ]`）を Phase 順に1つずつ実装し、完了したタスクのチェックボックスを更新しなければならない（SHALL）。

スキルは以下を実行しなければならない（SHALL）:
- `.modscape/codegen-rules.md`・`.modscape/changes/modscape-spec.custom.md`（存在する場合）を読み込む
- `changes/<name>/spec-model.yaml`（作業用YAML）の対象テーブル定義を参照してコードを生成する
- タスク完了後に `changes/<name>/tasks.md` の該当行を `- [x]` に更新する
- 1タスク完了後に「次のタスクに進みますか？」と確認してから次へ進む

スキルは `.modscape/changes/modscape-spec.custom.md` が存在する場合、ターゲットツールや出力フォーマットについてそのルールを優先して適用しなければならない（SHALL）。

スキルは `design.md` から **Context Only スキップリスト** を構築しなければならない（SHALL）:
- `.modscape/changes/<name>/design.md` が存在する場合: `### Downstream Impact — Context Only` セクションからすべてのテーブルIDを抽出してスキップリストに追加する
- `design.md` が存在しない、またはそのセクションが存在しない場合: スキップリストは空とし、すべてのテーブルを実装対象として扱う（後方互換）

スキップリストに含まれるテーブルIDのタスクは `⏭️ Skipping \`<id>\` (Context Only)` を出力してスキップしなければならない（SHALL）。

スキルは実装中に人間の調査なしに判断できない事項（例：型の不一致、想定外のNULL、ソースレコードの不在）を検知した場合、`.modscape/changes/<name>/questions.md` に質問を追記しなければならない（SHALL）。質問がある場合、実装を一時停止してユーザーに確認するか、仮定を記録して続行するかを選択しなければならない（SHALL）。

#### Scenario: 未完了タスクを順に実装する
- **WHEN** `changes/<name>/tasks.md` に未完了タスクが存在する状態で `/modscape:spec:implement <name>` を実行する
- **THEN** AIは `changes/<name>/spec-model.yaml` を参照して最初の未完了タスクのコードを生成し、tasks.md のチェックボックスを更新して次タスクへの確認を行う

#### Scenario: 実装中に不明な事項を questions.md に積む
- **WHEN** 実装中にAIが型の不一致や想定外のNULLを発見した
- **THEN** AIは `questions.md` に質問を追記し、ユーザーに確認するか仮定で進むかを提示する

#### Scenario: すべてのタスクが完了している場合にメッセージを表示する
- **WHEN** `changes/<name>/tasks.md` の全タスクが完了済み（`- [x]`）の状態で `/modscape:spec:implement <name>` を実行する
- **THEN** AIは「すべてのタスクが完了しています。`/modscape:spec:archive <name>` を実行してspecを同期してください」と案内する

#### Scenario: tasks.md が存在しない場合に案内メッセージを表示する
- **WHEN** `.modscape/changes/<name>/tasks.md` が存在しない状態で `/modscape:spec:implement <name>` を実行する
- **THEN** AIは「先に `/modscape:spec:design <name>` を実行してタスクリストを生成してください」と案内する

#### Scenario: Context Only テーブルをスキップする
- **WHEN** tasks.md のタスクが `design.md` の `### Downstream Impact — Context Only` に含まれるテーブルIDである
- **THEN** AIはコードを生成せず `⏭️ Skipping \`<id>\` (Context Only)` を出力して次のタスクに進む

#### Scenario: design.md が存在しない場合のフォールバック
- **WHEN** `.modscape/changes/<name>/design.md` が存在しない状態で `/modscape:spec:implement <name>` を実行する
- **THEN** スキップリストは空として扱い、tasks.md に含まれるすべてのテーブルを実装対象として処理する
