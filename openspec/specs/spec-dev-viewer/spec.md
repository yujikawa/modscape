## Requirements

### Requirement: modscape spec dev コマンド
`modscape spec dev <name>` コマンドは `.modscape/changes/<name>/` ディレクトリをspecモードとして起動しなければならない（SHALL）。

#### Scenario: modscape spec dev でspecモードが起動する
- **WHEN** `modscape spec dev monthly-sales` を実行する
- **THEN** `.modscape/changes/monthly-sales/` をターゲットとしてdevサーバーが起動し、ブラウザが開く

#### Scenario: 存在しないspec名を指定した場合はエラーになる
- **WHEN** `modscape spec dev nonexistent` を実行する
- **THEN** `.modscape/changes/nonexistent/ が見つかりません` というエラーメッセージを表示して終了する

### Requirement: specモードの統合ビューアレイアウト
specモードで起動したビジュアライザは、左ペインにspec-model.yamlのCytoscapeグラフ、右ペインにHTMLタブビューアを表示しなければならない（SHALL）。

#### Scenario: 左ペインにspec-model.yamlのグラフが表示される
- **WHEN** specモードでビジュアライザが起動する
- **THEN** 左ペインに `.modscape/changes/<name>/spec-model.yaml` のCytoscapeグラフが表示される

#### Scenario: 右ペインにHTMLタブが表示される
- **WHEN** specモードでビジュアライザが起動する
- **THEN** 右ペインに Spec / Design / Tasks / Questions のタブが表示され、対応するHTMLファイルの内容がiframeで表示される

#### Scenario: spec-model.yamlが存在しない場合はグラフペインが空になる
- **WHEN** `.modscape/changes/<name>/spec-model.yaml` が存在しない状態でspecモードを起動する
- **THEN** 左ペインは空のキャンバスを表示し、右ペインのHTMLタブは正常に動作する

### Requirement: specモードのライブリロード
specモードのdevサーバーは `.modscape/changes/<name>/` 配下の `.html` および `.yaml` ファイルの変更を監視し、変更時にブラウザを自動更新しなければならない（SHALL）。

#### Scenario: HTMLファイルの変更がライブリロードされる
- **WHEN** specモード起動中に `design.html` が更新される
- **THEN** ブラウザの該当タブが自動的にリロードされ、最新の内容が表示される

#### Scenario: spec-model.yamlの変更がグラフに反映される
- **WHEN** specモード起動中に `spec-model.yaml` が更新される
- **THEN** 左ペインのグラフが自動的に再描画される

### Requirement: specモードのタブ存在チェック
対応するHTMLファイルが存在しないタブは非表示またはdisabled状態で表示されなければならない（SHALL）。

#### Scenario: design.htmlが存在しない場合Designタブが無効になる
- **WHEN** `.modscape/changes/<name>/design.html` が存在しない状態でspecモードを起動する
- **THEN** Designタブはdisabledまたは非表示で表示される

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
