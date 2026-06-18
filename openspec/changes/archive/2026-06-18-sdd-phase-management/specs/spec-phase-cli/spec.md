## ADDED Requirements

### Requirement: spec-config.yaml に phase フィールドを持つ

`spec-config.yaml` は `phase` フィールドを持たなければならない（SHALL）。値は `requirements` / `design` / `tasks` / `implement` / `done` のいずれか。`modscape spec new` で作成される初期ファイルには `phase` フィールドを含めない（フェーズは各スキルが初回実行時に設定する）。既存の `spec-config.yaml` に `phase` がない場合はフォールバック動作とする。

#### Scenario: 新規 spec 作成直後
- **WHEN** `modscape spec new <name>` を実行する
- **THEN** 生成される `spec-config.yaml` には `phase` フィールドが含まれない

#### Scenario: requirements スキル完了後
- **WHEN** `/modscape:spec:requirements` が完了する
- **THEN** `spec-config.yaml` の `phase` が `requirements` に設定される

### Requirement: modscape spec get コマンド

`modscape spec get <name> [--json]` コマンドは、指定した spec の現在状態を出力しなければならない（SHALL）。出力には `name` / `phase` / `title` / `taskProgress` / `openQuestions` / `files` を含む。`--json` フラグを指定すると JSON 形式で出力する。`phase` が未設定（フォールバック）の場合は `null` を返す。

#### Scenario: JSON 出力
- **WHEN** `modscape spec get monthly-sales --json` を実行する
- **THEN** `{ "name": "monthly-sales", "phase": "design", "title": "...", "taskProgress": { "done": 3, "total": 8 }, "openQuestions": 2, "files": [...] }` を出力する

#### Scenario: テキスト出力
- **WHEN** `modscape spec get monthly-sales` を実行する（`--json` なし）
- **THEN** フェーズ・タスク進捗・未回答質問数を人が読みやすい形式で出力する

#### Scenario: 存在しない spec 名を指定
- **WHEN** `modscape spec get nonexistent` を実行する
- **THEN** エラーメッセージを表示して非ゼロで終了する

### Requirement: modscape spec set-phase コマンド

`modscape spec set-phase <name> <phase>` コマンドは、`spec-config.yaml` の `phase` フィールドを更新しなければならない（SHALL）。`phase` 引数が有効値（`requirements` / `design` / `tasks` / `implement` / `done`）以外の場合はエラーを返す。

#### Scenario: 有効なフェーズへの更新
- **WHEN** `modscape spec set-phase monthly-sales design` を実行する
- **THEN** `spec-config.yaml` の `phase: design` に更新され、成功メッセージを表示する

#### Scenario: 無効なフェーズ値の拒否
- **WHEN** `modscape spec set-phase monthly-sales unknown` を実行する
- **THEN** 有効なフェーズ値の一覧を表示してエラー終了する

#### Scenario: spec-config.yaml が存在しない場合
- **WHEN** `spec-config.yaml` がない spec に対して実行する
- **THEN** エラーメッセージを表示して終了する

### Requirement: modscape spec list にフェーズを表示

`modscape spec list` の出力に各 spec の `phase` を含めなければならない（SHALL）。`phase` が未設定の場合は `-` を表示する。

#### Scenario: フェーズあり spec の一覧
- **WHEN** `modscape spec list` を実行する
- **THEN** `• monthly-sales  [design]  [3/8 tasks]` のようにフェーズを表示する

#### Scenario: フェーズ未設定の spec を含む一覧
- **WHEN** `phase` が未設定の spec が存在する状態で `modscape spec list` を実行する
- **THEN** 該当 spec のフェーズ列は `-` を表示する
