## MODIFIED Requirements

### Requirement: per-table spec の HTML テンプレートを提供する
`src/templates/spec/html/table-spec-template.html` が存在しなければならない（SHALL）。このテンプレートは archive スキルが `output_format: html` 時に per-table spec を生成する際の雛形として使用される。テンプレートはテーブル ID・grain・ビジネスルール・依存関係・Changelog のセクションを含まなければならない（SHALL）。

#### Scenario: html モードで archive を実行するとテンプレートが参照される
- **WHEN** `output_format: html` が設定された状態で archive スキルを実行する
- **THEN** archive スキルは `src/templates/spec/html/table-spec-template.html` を読み込み、テーブル情報を埋め込んだ `spec.html` を生成する

### Requirement: per-table HTML spec は modscape spec open / spec build で閲覧する
`specIsHtml: true` の per-table spec は ContextPanel の iframe ではなく、`modscape spec open` または `modscape spec build` で生成される専用ブラウザで閲覧しなければならない（SHALL）。ContextPanel の Specs タブは MD テキストの `<pre>` 表示のみを提供する（SHALL）。

#### Scenario: spec.html は ContextPanel に埋め込まれない
- **WHEN** `.modscape/specs/<model-slug>/<table-id>.html` が存在する状態で ContextPanel の Specs タブを開く
- **THEN** ContextPanel は iframe を表示しない。HTML spec の閲覧は `modscape spec open` で行う

#### Scenario: spec.md は ContextPanel に従来通り表示される
- **WHEN** `spec.html` が存在せず `spec.md` のみ存在するテーブルを Specs タブで展開する
- **THEN** spec.md の内容が `<pre>` テキストとして表示される（後方互換）
