## ADDED Requirements

### Requirement: modscape spec open — 恒久 spec ブラウザの起動
`modscape spec open` は `.modscape/specs/` をスキャンし、モデルスラグ別テーブル一覧と HTML spec を表示する専用ブラウザを Express サーバーとして起動しなければならない（SHALL）。起動後、自動でブラウザを開かなければならない（SHALL）。

**UI レイアウト（SHALL）:**
- 左ペイン: モデルスラグごとのテーブル一覧（spec ファイルが存在するもののみ）
- 右ペイン: 選択されたテーブルの spec を表示（`.html` は iframe、`.md` は `<pre>`）
- React/Vite 不要。サーバーレンダリング HTML + 最小限の vanilla JS で実装する

**エンドポイント（SHALL）:**
- `GET /` — spec ブラウザの HTML を返す
- `GET /api/table-spec/:modelSlug/:tableId` — `specs/<modelSlug>/<tableId>.html` を `text/html` で配信する（`?theme=light` で CSS 注入）
- `GET /api/table-spec-md/:modelSlug/:tableId` — `specs/<modelSlug>/<tableId>.md` を `text/plain` で配信する
- `GET /api/spec-index` — スキャン結果を JSON で返す（`{ modelSlug: string, tables: string[] }[]`）

#### Scenario: spec ブラウザが起動してテーブル一覧が表示される
- **WHEN** `modscape spec open` を実行する
- **THEN** Express サーバーが起動し、ブラウザが開いて左ペインにモデルスラグ別テーブル一覧が表示される

#### Scenario: テーブルを選択すると spec が右ペインに表示される
- **WHEN** 左ペインのテーブルをクリックする
- **THEN** 右ペインに spec.html が iframe で表示される（spec.html がない場合は spec.md が `<pre>` で表示される）

#### Scenario: .modscape/specs/ が存在しない場合はメッセージを表示する
- **WHEN** `.modscape/specs/` が存在しない状態で `modscape spec open` を実行する
- **THEN** 「specs ディレクトリが見つかりません」というメッセージを表示する

#### Scenario: spec ファイルの変更がライブリロードされる
- **WHEN** `.modscape/specs/` 配下のファイルが更新される
- **THEN** ブラウザが自動リロードされ最新の内容が反映される
