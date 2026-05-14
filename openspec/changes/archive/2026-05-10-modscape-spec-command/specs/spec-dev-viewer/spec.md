## MODIFIED Requirements

### Requirement: modscape spec dev コマンド
`modscape spec dev <name>` コマンドは `.modscape/changes/<name>/` ディレクトリを対象として SDD 作業中変更のビューアを起動しなければならない（SHALL）。`modscape dev --spec <name>` は廃止し、このコマンドに移行する（**BREAKING**）。

#### Scenario: modscape spec dev でspecモードが起動する
- **WHEN** `modscape spec dev monthly-sales` を実行する
- **THEN** `.modscape/changes/monthly-sales/` をターゲットとして dev サーバーが起動し、ブラウザが開く

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

### Requirement: specモードのライブリロード
specモードのdevサーバーは `.modscape/changes/<name>/` 配下の `.html` および `.yaml` ファイルの変更を監視し、変更時にブラウザを自動更新しなければならない（SHALL）。

### Requirement: specモードのタブ存在チェック
対応するHTMLファイルが存在しないタブは非表示またはdisabled状態で表示されなければならない（SHALL）。
