## ADDED Requirements

### Requirement: `modscape context export`コマンドで全暗黙知を統合出力する

`modscape context export [specs-dir]`コマンドは、以下のソースを集約してJSON/Markdown形式で出力する:
- `.modscape/specs/_context.yaml`（decisions + questions）
- `.modscape/specs/_glossary.yaml`（用語集）
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
  "glossary": [...],
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
- **THEN** `_context.yaml`のdecisions/questions・`_glossary.yaml`のterms・全テーブルのspec.md/questions.mdを統合したJSONがstdoutに出力される

#### Scenario: Markdown形式で出力する
- **WHEN** `modscape context export --format md`を実行する
- **THEN** Glossary セクションを含むMarkdown文書がstdoutに出力される

#### Scenario: specsディレクトリが存在しない場合はエラーにならない
- **WHEN** `.modscape/specs/`が存在しない状態で`modscape context export`を実行する
- **THEN** エラーを投げずに空の結果（`{"decisions":[],"questions":[],"glossary":[],"tables":{}}`）を返す

#### Scenario: per-tableのspec.mdが一部存在しない場合もスキップして継続する
- **WHEN** 一部のテーブルに`spec.md`が存在しない
- **THEN** 存在するファイルのみを集約し、存在しないファイルはスキップする

#### Scenario: _glossary.yaml が存在しない場合は空配列を返す
- **WHEN** `_glossary.yaml` が存在しない
- **THEN** `glossary: []` として出力し、エラーを投げない

---

## MODIFIED Requirements

### Requirement: loadContext が ids フィールドでエンティティ参照を読み取る

`src/export.js` の `loadContext` 関数は、`_glossary.yaml` の `terms[].ids`、`_questions.yaml` の `questions[].ids`、`_context.yaml` の `decisions[].ids` を読み取らなければならない（SHALL）。旧フィールド名（`tables`・`table`）は読み取らない。

#### Scenario: _glossary.yaml の ids フィールドを正しく読み取る
- **WHEN** `terms[].ids: [fct_orders, mart_daily_revenue]` を持つ `_glossary.yaml` を `loadContext` で読み込む
- **THEN** 返り値の `glossary[].ids` に `['fct_orders', 'mart_daily_revenue']` が含まれる

#### Scenario: _questions.yaml の ids フィールドを正しく読み取る
- **WHEN** `questions[].ids: [fct_orders]` を持つ `_questions.yaml` を `loadContext` で読み込む
- **THEN** 返り値の `questions[].ids` に `['fct_orders']` が含まれる

#### Scenario: _context.yaml の ids フィールドを正しく読み取る
- **WHEN** `decisions[].ids: [fct_orders]` を持つ `_context.yaml` を `loadContext` で読み込む
- **THEN** 返り値の `decisions[].ids` に `['fct_orders']` が含まれる

#### Scenario: ids を持たないエントリは空配列として扱う
- **WHEN** `ids` フィールドを持たないエントリを `loadContext` で読み込む
- **THEN** 該当エントリの `ids` は `[]` または `undefined` として返され、エラーは発生しない
