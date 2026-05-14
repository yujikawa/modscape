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
specモードのdevサーバーは `.modscape/changes/<name>/` 配下の `.md`、`.html`、`.yaml` ファイルの変更を監視し、変更時にブラウザを自動更新しなければならない（SHALL）。

#### Scenario: MDファイルの変更がライブリロードされる
- **WHEN** specモード起動中に `design.md` が更新される
- **THEN** ブラウザの該当タブが自動的にリロードされ、最新の内容が表示される

#### Scenario: spec-model.yamlの変更がグラフに反映される
- **WHEN** specモード起動中に `spec-model.yaml` が更新される
- **THEN** 左ペインのグラフが自動的に再描画される

### Requirement: specモードのタブ存在チェック
対応するファイル（`.html` または `.md`）が存在しないタブは非表示またはdisabled状態で表示されなければならない（SHALL）。`.html` が存在しない場合は `.md` にフォールバックして表示する。

#### Scenario: design.mdが存在する場合Designタブが有効になる
- **WHEN** `.modscape/changes/<name>/design.md` が存在する状態でspecモードを起動する
- **THEN** Designタブが有効な状態で表示される
