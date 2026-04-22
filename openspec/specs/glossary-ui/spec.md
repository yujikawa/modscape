## ADDED Requirements

### Requirement: ContextPanel に Glossary セクションを表示する

ContextPanel の Decisions・Q&A・Table Specs に加えて、`_glossary.yaml` の内容を Glossary セクションとして表示する。各用語カードには `id`・`definition`・`label`（あれば）・`tables`（あれば）を表示する。検索フォームの対象に glossary も含める。

#### Scenario: glossary セクションが表示される
- **WHEN** `_glossary.yaml` に1件以上の用語が存在する状態で ContextPanel を開く
- **THEN** "Glossary (N)" セクションが表示され、各用語カードが一覧される

#### Scenario: glossary が空の場合はセクションを非表示にする
- **WHEN** `_glossary.yaml` が存在しないか `terms: []` の場合
- **THEN** Glossary セクションは表示されない

#### Scenario: 検索フォームで用語を絞り込む
- **WHEN** ContextPanel の検索フォームに文字を入力する
- **THEN** `id`・`label`・`definition` にマッチする用語のみが表示される

### Requirement: dev サーバーと build で glossary データを提供する

dev サーバーは `/api/glossary` エンドポイントで `_glossary.yaml` の内容をテキストで返す。`modscape build` は `glossaryData` を `window.__MODSCAPE_DATA__` に注入する。

#### Scenario: dev モードで glossary を取得する
- **WHEN** ブラウザが `/api/glossary` にリクエストする
- **THEN** `.modscape/specs/_glossary.yaml` の内容がテキストで返される

#### Scenario: ファイルが存在しない場合は 404 を返す
- **WHEN** `_glossary.yaml` が存在しない状態で `/api/glossary` にリクエストする
- **THEN** 404 が返され、ContextPanel は Glossary セクションを非表示にする
