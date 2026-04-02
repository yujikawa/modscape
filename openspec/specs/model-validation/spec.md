## ADDED Requirements

### Requirement: validateコマンド
システムは `modscape validate <file>` コマンドを提供しなければならない（SHALL）。model.yamlの構造的整合性を検証し、エラーと警告を報告する。

#### Scenario: 正常なYAMLを検証する
- **WHEN** `modscape validate model.yaml` を正常なファイルに対して実行する
- **THEN** 「valid」と表示され終了コード0で終了する

#### Scenario: エラーのあるYAMLを検証する
- **WHEN** 構造エラーのあるファイルに対して実行する
- **THEN** エラーの詳細が表示され終了コード1で終了する

#### Scenario: --json オプションで構造化出力する
- **WHEN** `modscape validate model.yaml --json` を実行する
- **THEN** `{ "valid": bool, "errors": [...], "warnings": [...] }` 形式のJSONが出力される

### Requirement: 座標配置チェック
バリデーターは `tables` または `domains` セクション内に座標フィールド（x/y/width/height）が存在する場合エラーを報告しなければならない（SHALL）。

#### Scenario: tablesに座標が混入している
- **WHEN** テーブル定義内に `x: 100` が記述されている
- **THEN** `tables[<id>]` にx/yが含まれているというエラーが報告される

### Requirement: 参照整合性チェック
バリデーターはrelationships・lineage・domains・layoutの参照先IDが実在することを確認しなければならない（SHALL）。

#### Scenario: 存在しないテーブルをrelationshipで参照する
- **WHEN** relationshipsのfrom.tableに存在しないIDが指定されている
- **THEN** 参照先が見つからないというエラーが報告される

#### Scenario: 存在しないIDをlineageで参照する
- **WHEN** lineageのfromまたはtoに存在しないIDが指定されている
- **THEN** 参照先が見つからないというエラーが報告される

#### Scenario: layoutに存在しないIDが記述されている
- **WHEN** layoutのキーにtablesにもdomainsにも存在しないIDがある
- **THEN** 孤立したlayoutエントリとして警告が報告される

### Requirement: 座標グリッドチェック
バリデーターはlayout内のx/y座標が40の倍数であることを確認しなければならない（SHALL）。

#### Scenario: 座標が40の倍数でない
- **WHEN** layout内のx座標が45など40の倍数でない値になっている
- **THEN** グリッド違反のエラーが報告される

### Requirement: ID重複チェック
バリデーターはtables・domains・relationships・lineage内でIDが重複していないことを確認しなければならない（SHALL）。

#### Scenario: テーブルIDが重複している
- **WHEN** 同一IDを持つテーブルが2つ存在する
- **THEN** ID重複エラーが報告される
