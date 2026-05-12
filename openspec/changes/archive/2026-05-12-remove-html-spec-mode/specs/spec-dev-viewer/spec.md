## MODIFIED Requirements

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

## REMOVED Requirements

### Requirement: HTML成果物のカラースキームはテーマ非依存のライトグレーベースを使用しなければならない
**Reason**: HTMLテンプレートを廃止したため不要。MD→HTML変換はサーバーサイドで行い、スタイルはspec.jsが一元管理する。
