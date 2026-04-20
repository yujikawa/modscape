## ADDED Requirements

### Requirement: `modscape context export`コマンドで全暗黙知を統合出力する

`modscape context export [specs-dir]`コマンドは、以下のソースを集約してJSON/Markdown形式で出力する:
- `.modscape/specs/_context.yaml`（decisions のみ）
- `.modscape/specs/_questions.yaml`（Q&A の一元管理ファイル）
- `.modscape/specs/<table-id>/spec.md`（全テーブルのspec）

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
      "spec": "<spec.mdの内容>"
    }
  }
}
```

#### Scenario: JSON形式で全暗黙知を出力する
- **WHEN** `modscape context export`を実行する（--format省略）
- **THEN** `_context.yaml`のdecisionsと`_questions.yaml`のquestionsと全テーブルのspec.mdを統合したJSONがstdoutに出力される

#### Scenario: Markdown形式で出力する
- **WHEN** `modscape context export --format md`を実行する
- **THEN** セクション見出しを持つMarkdown文書がstdoutに出力される

#### Scenario: specsディレクトリが存在しない場合はエラーにならない
- **WHEN** `.modscape/specs/`が存在しない状態で`modscape context export`を実行する
- **THEN** エラーを投げずに空の結果（`{"decisions":[],"questions":[],"tables":{}}`）を返す

#### Scenario: per-tableのspec.mdが一部存在しない場合もスキップして継続する
- **WHEN** 一部のテーブルに`spec.md`が存在しない
- **THEN** 存在するファイルのみを集約し、存在しないファイルはスキップする

---

## MODIFIED Requirements

### Requirement: context export が _questions.yaml を出力に含める
`modscape context export` コマンドの出力に `_questions.yaml` のデータを含める。`_context.yaml` の questions セクションは参照しない。

#### Scenario: JSON 出力に questions フィールドが含まれる
- **WHEN** `modscape context export --format json` を実行する
- **THEN** 出力 JSON に `questions` フィールドが含まれ、`_questions.yaml` の内容が反映される

#### Scenario: Markdown 出力に Q&A セクションが含まれる
- **WHEN** `modscape context export --format markdown` を実行する（またはデフォルト出力）
- **THEN** `## Q&A` セクションが `_questions.yaml` のエントリで構成される

#### Scenario: _questions.yaml が存在しない場合は空リスト
- **WHEN** `_questions.yaml` が存在しない状態で context export を実行する
- **THEN** questions フィールドは空配列になり、エラーにならない
