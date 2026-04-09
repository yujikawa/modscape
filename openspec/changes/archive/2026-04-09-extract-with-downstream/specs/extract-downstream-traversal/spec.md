## ADDED Requirements

### Requirement: --with-downstream フラグによる下流テーブルの自動収集
`modscape extract` は `--with-downstream` フラグを受け付けなければならない（SHALL）。このフラグが指定された場合、CLIは全入力YAMLの `lineage` セクションを合成してグラフを構築し、`--tables` で指定されたテーブルIDを起点として全下流テーブルを再帰的（BFS）に収集しなければならない（SHALL）。収集したIDを `--tables` で指定したIDと合算して、以降の抽出処理を実行しなければならない（SHALL）。

#### Scenario: 単一YAMLで下流テーブルを再帰収集する
- **WHEN** `modscape extract master.yaml --tables fct_orders --with-downstream` を実行し、lineage が `fct_orders → mart_monthly → report_a` の場合
- **THEN** `mart_monthly` と `report_a` が自動収集され、`fct_orders`・`mart_monthly`・`report_a` の3テーブルが出力に含まれる

#### Scenario: 複数テーブルを起点に下流の和集合を収集する
- **WHEN** `modscape extract master.yaml --tables fct_orders,fct_returns,fct_refunds --with-downstream` を実行する
- **THEN** 3テーブルを同時起点にBFSし、それぞれの全下流テーブルの和集合が収集されて出力に含まれる
- **THEN** 複数起点から到達する同じ下流テーブルは重複なく1件のみ出力に含まれる

#### Scenario: 複数YAMLをまたいで下流テーブルを収集する
- **WHEN** `modscape extract hr.yaml report.yaml --tables fct_orders --with-downstream` を実行し、`fct_orders` は `hr.yaml` に、下流の `mart_monthly` は `report.yaml` に存在する場合
- **THEN** 両YAMLの lineage を合成したグラフで下流を解決し、`mart_monthly` が出力に含まれる

#### Scenario: フラグなし時は既存動作を維持する
- **WHEN** `--with-downstream` フラグなしで `modscape extract` を実行する
- **THEN** `--tables` で指定したIDのみを抽出し、既存の動作と完全に同じ結果になる

### Requirement: 循環 lineage の検出と警告
`--with-downstream` 使用時に lineage グラフ内で循環が検出された場合、CLIは警告メッセージを標準エラー出力に出力しなければならない（SHALL）。循環が検出されてもコマンドは処理を継続しなければならない（SHALL）。

#### Scenario: 循環 lineage がある場合に警告して継続する
- **WHEN** lineage に `a → b → a` のような循環が存在し `--with-downstream` で実行する
- **THEN** `⚠️ Circular lineage detected` を含む警告が標準エラー出力に表示される
- **THEN** コマンドはエラー終了せず、収集できた下流テーブルを抽出して正常終了する

### Requirement: --with-downstream 使用時の --record への下流テーブル記録
`--with-downstream` によって追加収集されたテーブルを `--record` で指定した `spec-config.yaml` に記録する際、そのテーブルが実際に存在したYAMLのパスをソースとして記録しなければならない（SHALL）。`spec-config.yaml` に未登録のYAMLファイルが下流テーブルのソースである場合、そのファイルを新エントリとして自動追加しなければならない（SHALL）。

#### Scenario: 下流テーブルのソースYAMLを spec-config.yaml に記録する
- **WHEN** `--with-downstream --record spec-config.yaml` を使い、下流テーブルが `report.yaml` に存在する
- **THEN** `spec-config.yaml` の `master_yamls` に `report.yaml` エントリが作成され、下流テーブルIDが `tables` に記録される
