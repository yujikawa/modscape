## Requirements

### Requirement: per-table spec の HTML テンプレートを提供する
`src/templates/spec/html/table-spec-template.html` が存在しなければならない（SHALL）。このテンプレートは archive スキルが `output_format: html` 時に per-table spec を生成する際の雛形として使用される。テンプレートはテーブル ID・grain・ビジネスルール・依存関係・Changelog のセクションを含まなければならない（SHALL）。

#### Scenario: html モードで archive を実行するとテンプレートが参照される
- **WHEN** `output_format: html` が設定された状態で archive スキルを実行する
- **THEN** archive スキルは `src/templates/spec/html/table-spec-template.html` を読み込み、テーブル情報を埋め込んだ `spec.html` を生成する

### Requirement: per-table spec HTML は modscape spec コマンドで閲覧する
per-table spec の `.html` ファイルは、ContextPanel への埋め込みではなく `modscape spec open` または `modscape spec build` コマンドで専用のブラウザ UI として閲覧しなければならない（SHALL）。`ContextPanel` の Specs タブは `.md` ファイルの `<pre>` テキスト表示のみを提供する（SHALL）。

#### Scenario: modscape spec open で HTML spec を閲覧する
- **WHEN** `.modscape/specs/<slug>/fct_orders.html` が存在する状態で `modscape spec open` を実行する
- **THEN** ブラウザに左ペイン（テーブル一覧）と右ペイン（iframe で HTML spec を表示）の 2 カラム UI が表示される

#### Scenario: modscape spec build で静的 spec ブラウザを生成する
- **WHEN** `modscape spec build` を実行する
- **THEN** `dist/specs/` に `index.html` と各スラグ配下の `.html` ファイルがコピーされ、静的ブラウザとして閲覧可能になる

#### Scenario: ContextPanel の Specs タブは MD テキスト表示のみを提供する
- **WHEN** Specs タブでテーブルを展開する
- **THEN** `.md` ファイルの内容が `<pre>` テキストとして表示される（iframe や HTML 埋め込みは行わない）
