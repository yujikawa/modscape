## ADDED Requirements

### Requirement: HTML成果物のカラースキームはテーマ非依存のライトグレーベースを使用しなければならない

spec dev viewerで表示されるすべてのHTMLアーティファクト（spec.html / design.html / tasks.html / questions.html / table-spec.html）は、OSやブラウザのテーマ設定（ダーク/ライト）に関係なく同一の見た目になるテーマ非依存のカラースキームを使用しなければならない（SHALL）。

基底色はライトグレー系（body背景: `#f8f9fa` 相当）を採用し、テキストは暗色（`#1e293b` 相当）を使用しなければならない（SHALL）。ダークモード固定の配色（`#0f172a` 等）を使用してはならない（SHALL NOT）。

サーバー側でのテーマ切り替えCSS注入（`LIGHT_MODE_CSS` 等）を行ってはならない（SHALL NOT）。テンプレート自体がテーマ非依存であるため、クエリパラメータによるテーマ上書きも不要とする。

#### Scenario: spec devビューアでHTMLがライトグレー背景で表示される
- **WHEN** `modscape spec dev <name>` を実行し、ブラウザでspec.htmlタブを開く
- **THEN** spec.htmlはライトグレー背景（`#f8f9fa` 相当）に暗色テキストで表示される
- **THEN** OSのダークモード設定に関係なく、同じ見た目で表示される

#### Scenario: すべてのHTMLタブで一貫したカラースキームが適用される
- **WHEN** spec devビューアのSpec / Design / Tasks / Questionsタブを順に表示する
- **THEN** すべてのタブで同一のカラースキームが適用される

## REMOVED Requirements

### Requirement: サーバー側LIGHTモードCSS注入

**Reason**: テンプレート自体をテーマ非依存にしたため、サーバー側でのCSS注入が不要になった。
**Migration**: `?theme=light` クエリパラメータは削除する。HTMLテンプレートが常にライトグレーベースのスタイルを持つため、追加操作は不要。
