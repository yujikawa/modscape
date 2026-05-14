## MODIFIED Requirements

### Requirement: YAML File Watching
The dev server SHALL watch the specified YAML file for changes and notify the visualizer via WebSocket.

### Requirement: Layout Update API
The dev server SHALL provide an API endpoint to receive and persist layout changes.

### Requirement: modscape dev は YAML ビジュアライザ専用とする
`modscape dev` コマンドは `--spec` フラグを受け付けてはならない（SHALL NOT）。SDD 変更ビューアは `modscape spec dev <name>` で提供する。

#### Scenario: --spec フラグを渡してもエラーまたは無視される
- **WHEN** `modscape dev --spec foo` を実行する
- **THEN** `--spec` フラグは認識されず、エラーまたは未知フラグとして扱われる
