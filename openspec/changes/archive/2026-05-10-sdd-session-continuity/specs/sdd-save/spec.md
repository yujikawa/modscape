## ADDED Requirements

### Requirement: saveコマンド
システムは `/modscape:spec:save <name>` コマンドを提供しなければならない（SHALL）。現在の会話状態（決定済み事項・未解決事項・次のアクション・メモ）を `.modscape/changes/<name>/session.md` に保存する。フェーズや会話内容を問わず任意のタイミングで実行できる。

#### Scenario: 設計中に save を実行する
- **WHEN** design の議論が途中の状態で `/modscape:spec:save fct_orders` を実行する
- **THEN** 会話から決定済み事項・未解決事項・次のアクションを抽出し `session.md` に書き込む

#### Scenario: 実装中に save を実行する
- **WHEN** implement セッションの途中で `/modscape:spec:save fct_orders` を実行する
- **THEN** 現在の作業状態（完了タスク・途中タスク・メモ）を `session.md` に書き込む

#### Scenario: 複数回 save を実行する
- **WHEN** 同じ name に対して複数回 save を実行する
- **THEN** `session.md` は上書きされ、最新の状態のみが保持される

#### Scenario: 変更ディレクトリが存在しない
- **WHEN** 存在しない name を指定して save を実行する
- **THEN** エラーメッセージを表示し、`/modscape:spec:requirements` の実行を促す

### Requirement: session.md のフォーマット
`session.md` は以下の固定フォーマットで出力されなければならない（SHALL）。

#### Scenario: session.md の構造
- **WHEN** save が正常に完了する
- **THEN** `## セッション保存 — <name> (<日付>)` を見出しとし、`### 決定済み事項`・`### 未解決事項`・`### 次のアクション`・`### メモ` の4セクションを含むファイルが生成される

### Requirement: 保存確認の表示
save 実行後、保存した内容のプレビューをコンソールに表示しなければならない（SHALL）。

#### Scenario: 保存完了の確認表示
- **WHEN** save が正常に完了する
- **THEN** 保存したセクションの内容を表示し、「再開するには `/modscape:spec:status <name>` を実行してください」と案内する
