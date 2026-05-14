## Requirements

### Requirement: modscape spec open — spec ブラウザ dev server
`modscape spec open` は `.modscape/specs/` 配下をスキャンし、モデルスラグ別テーブル一覧を左ペイン、HTML spec の iframe を右ペインに持つ 2 カラムの spec ブラウザをブラウザで起動しなければならない（SHALL）。サーバーは Express で実装し、ブラウザ UI は vanilla JS のサーバーレンダリング HTML で提供する（SHALL）。ブラウザは起動後に自動的に開かれなければならない（SHALL）。

#### Scenario: modscape spec open で spec ブラウザが起動する
- **WHEN** `modscape spec open` を実行する
- **THEN** Express サーバーが起動し、ブラウザが自動的に開かれ、左ペインにモデル別テーブル一覧・右ペインに選択した spec の内容が表示される

#### Scenario: HTML spec が iframe で表示される
- **WHEN** `.modscape/specs/<slug>/<tableId>.html` が存在するテーブルを一覧から選択する
- **THEN** 右ペインに `/api/table-spec/<slug>/<tableId>` エンドポイントから取得した HTML が iframe でレンダリングされる

#### Scenario: MD spec が pre テキストで表示される
- **WHEN** `.html` が存在せず `.md` のみ存在するテーブルを選択する
- **THEN** 右ペインに `/api/table-spec-md/<slug>/<tableId>` から取得した MD テキストが `<pre>` で表示される

### Requirement: ライブリロード対応
`.modscape/specs/` 配下の `.html` / `.md` ファイルの変更を chokidar で監視し、変更時に WebSocket でブラウザを自動リロードしなければならない（SHALL）。

#### Scenario: HTML spec を更新するとブラウザが自動リロードされる
- **WHEN** `modscape spec open` 起動中に `.modscape/specs/<slug>/<tableId>.html` が更新される
- **THEN** ブラウザが自動的にリロードされ、最新の内容が表示される

### Requirement: /api/spec-index エンドポイント
`GET /api/spec-index` はスラグ別のテーブル一覧を JSON で返さなければならない（SHALL）。

#### Scenario: spec-index が正しい構造を返す
- **WHEN** `GET /api/spec-index` を呼び出す
- **THEN** `{ slug: string, tables: { id: string, hasHtml: boolean }[] }[]` 形式のレスポンスが返される
