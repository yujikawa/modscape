## ADDED Requirements

### Requirement: annotationの一覧取得
システムはYAMLファイルの `annotations` セクションに含まれる全エントリを返さなければならない（SHALL）。

#### Scenario: annotationが存在する場合
- **WHEN** `annotation list <file>` または `list_annotations` MCPツールを呼び出す
- **THEN** `[{ id, type, text, color, targetId, targetType }]` 形式の配列を返す

#### Scenario: annotationが存在しない場合
- **WHEN** `annotations` セクションが空またはYAMLに存在しない
- **THEN** 空配列を返す

---

### Requirement: annotationの追加
システムはYAMLファイルの `annotations` セクションに新しいエントリを追加できなければならない（SHALL）。

#### Scenario: 必須フィールドのみで追加
- **WHEN** `annotation add <file> --text "..." --type sticky` を実行する
- **THEN** idが自動生成（`note-{timestamp}` 形式）され、annotationsに追加されYAMLに保存される

#### Scenario: 全フィールドを指定して追加
- **WHEN** `--id`, `--type`, `--text`, `--color`, `--target-id`, `--target-type`, `--offset-x`, `--offset-y` を指定する
- **THEN** 指定した全フィールドがYAMLに保存される

#### Scenario: 重複IDで追加しようとした場合
- **WHEN** すでに存在するIDを `--id` で指定する
- **THEN** エラーを返し、YAMLは変更されない

---

### Requirement: annotationの更新
システムは既存のannotationのフィールドを部分更新できなければならない（SHALL）。

#### Scenario: テキストを更新
- **WHEN** `annotation update <file> --id note_001 --text "新しいテキスト"` を実行する
- **THEN** 指定フィールドのみ上書きされ、他フィールドは保持される

#### Scenario: 存在しないIDを指定した場合
- **WHEN** 存在しないIDを指定する
- **THEN** エラーを返し、YAMLは変更されない

---

### Requirement: annotationの削除
システムは指定したIDのannotationをYAMLから削除できなければならない（SHALL）。

#### Scenario: 正常に削除
- **WHEN** `annotation remove <file> --id note_001` を実行する
- **THEN** 該当エントリが削除されYAMLに保存される

#### Scenario: 存在しないIDを指定した場合
- **WHEN** 存在しないIDを指定する
- **THEN** エラーを返し、YAMLは変更されない

---

### Requirement: --jsonフラグでの機械可読出力
CLIコマンドは `--json` フラグを指定するとJSON形式で出力しなければならない（SHALL）。

#### Scenario: --jsonフラグ付きでlist実行
- **WHEN** `annotation list <file> --json` を実行する
- **THEN** JSON配列を標準出力に出力する
