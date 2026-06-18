## MODIFIED Requirements

### Requirement: statusコマンド
システムは `/modscape:spec:status <name>` コマンドを提供しなければならない（SHALL）。現在のフェーズ・ファイル存在状況・タスク進捗を表示し、**`session.md` が存在する場合は前回のセッション内容を表示し**、**現在の状態から次に実行すべきアクションを1つ明示する**。

フェーズ判定は `modscape spec get <name> --json` の `phase` フィールドを使用しなければならない（SHALL）。`phase` が `null`（未設定）の場合のみ、tasks.md のチェックボックス数によるフォールバック判定を行う。

#### Scenario: 基本的なステータス表示
- **WHEN** `/modscape:spec:status fct_orders` を実行する
- **THEN** `modscape spec get fct_orders --json` を呼び出し、返却された `phase` をフェーズ表示に使用する

#### Scenario: session.md が存在する場合
- **WHEN** `.modscape/changes/<name>/session.md` が存在する状態で status を実行する
- **THEN** ステータスブロックの後に「前回のセッション」セクションとして session.md の内容（日付・決定済み事項・未解決事項・次のアクション）を表示する

#### Scenario: session.md が存在しない場合
- **WHEN** `session.md` が存在しない状態で status を実行する
- **THEN** 「前回のセッション」セクションは表示されない

#### Scenario: 次のアクションの提示 — Findingsあり
- **WHEN** `design.md` の `## Findings` に未処理エントリが存在する
- **THEN** 「次にやること」として `/modscape:spec:amend <name>` を提示する

#### Scenario: 次のアクションの提示 — 未回答の質問あり
- **WHEN** `questions.md` に未回答の質問が存在する（`- [ ]` のエントリ）
- **THEN** 「次にやること」として `/modscape:spec:answer <name>` を提示し、未回答件数を添える

#### Scenario: 次のアクションの提示 — 通常フロー
- **WHEN** Findingsも未回答質問もない通常状態
- **THEN** `phase` フィールドの値に基づいて次コマンドを1つ提示する（requirements→design、design→tasks、tasks→implement、implement→check/archive）

#### Scenario: 全タスク完了時
- **WHEN** `tasks.md` の全タスクが `[x]` 完了している
- **THEN** 「次にやること」として `/modscape:spec:check <name>` を提示し、続けて `/modscape:spec:archive <name>` も案内する

#### Scenario: phase が未設定（フォールバック）
- **WHEN** `modscape spec get` が `phase: null` を返す
- **THEN** tasks.md のチェックボックス数で進捗を判定し、フェーズを推定して表示する
