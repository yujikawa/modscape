## ADDED Requirements

### Requirement: per-table spec の HTML テンプレートを提供する
`src/templates/spec/html/table-spec-template.html` が存在しなければならない（SHALL）。このテンプレートは archive スキルが `output_format: html` 時に per-table spec を生成する際の雛形として使用される。テンプレートはテーブル ID・grain・ビジネスルール・依存関係・Changelog のセクションを含まなければならない（SHALL）。

#### Scenario: html モードで archive を実行するとテンプレートが参照される
- **WHEN** `output_format: html` が設定された状態で archive スキルを実行する
- **THEN** archive スキルは `src/templates/spec/html/table-spec-template.html` を読み込み、テーブル情報を埋め込んだ `spec.html` を生成する

### Requirement: ContextPanel の Specs タブが spec.html を iframe で表示する
`specIsHtml: true` のエントリに対し、`TableSpecSection` コンポーネントは `<pre>` ではなく `<iframe>` で HTML を表示しなければならない（SHALL）。iframe は `/api/table-spec/:modelSlug/:tableId` エンドポイントから HTML を取得する（SHALL）。`specIsHtml: false` の場合は従来の `<pre>` 表示を維持しなければならない（SHALL）。

#### Scenario: spec.html が存在するテーブルを Specs タブで開く
- **WHEN** Specs タブでテーブルを展開する
- **THEN** spec.html の内容が iframe でレンダリングされ、テキストではなくスタイル付き HTML が表示される

#### Scenario: spec.md のみ存在するテーブルは従来通り表示される
- **WHEN** `spec.html` が存在せず `spec.md` のみ存在するテーブルを Specs タブで展開する
- **THEN** spec.md の内容が `<pre>` テキストとして表示される（後方互換）
