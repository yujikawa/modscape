## ADDED Requirements

### Requirement: `modscape context export`コマンドで全暗黙知を統合出力する

`modscape context export [specs-dir]`コマンドは、以下のソースを集約してJSON/Markdown形式で出力する:
- `.modscape/specs/_context.yaml`（decisions + questions）
- `.modscape/specs/<table-id>/spec.md`（全テーブルのspec）
- `.modscape/specs/<table-id>/questions.md`（全テーブルのQ&A）

出力はstdoutに送られ、ファイルへのリダイレクトやAI SDKへのパイプで使用できる。

オプション:
- `--format json`（デフォルト）: 構造化JSON
- `--format md`: Markdownドキュメント（LLMプロンプト埋め込み向け）
- `[specs-dir]`（省略時: `.modscape/specs/`）: specsディレクトリのパス

JSON出力スキーマ:
```json
{
  "decisions": [...],
  "questions": [...],
  "tables": {
    "<table-id>": {
      "spec": "<spec.mdの内容>",
      "questions": "<questions.mdの内容>"
    }
  }
}
```

#### Scenario: JSON形式で全暗黙知を出力する
- **WHEN** `modscape context export`を実行する（--format省略）
- **THEN** `_context.yaml`のdecisions/questionsと全テーブルのspec.md/questions.mdを統合したJSONがstdoutに出力される

#### Scenario: Markdown形式で出力する
- **WHEN** `modscape context export --format md`を実行する
- **THEN** セクション見出しを持つMarkdown文書がstdoutに出力される

#### Scenario: specsディレクトリが存在しない場合はエラーにならない
- **WHEN** `.modscape/specs/`が存在しない状態で`modscape context export`を実行する
- **THEN** エラーを投げずに空の結果（`{"decisions":[],"questions":[],"tables":{}}`）を返す

#### Scenario: per-tableのspec.mdが一部存在しない場合もスキップして継続する
- **WHEN** 一部のテーブルに`spec.md`が存在しない
- **THEN** 存在するファイルのみを集約し、存在しないファイルはスキップする
