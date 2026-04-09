### Requirement: --with-downstream フラグによる下流テーブルの自動包含
`extract` コマンドは `--with-downstream` フラグをサポートしなければならない（SHALL）。このフラグを指定した場合、`--tables` で指定したテーブルだけでなく、lineage グラフ上でそれらのテーブルから下流（downstream）に連なるすべてのテーブルを再帰的に出力 YAML に含めなければならない（SHALL）。

#### Scenario: 指定テーブルの下流テーブルを一括抽出する
- **WHEN** `modscape extract model.yaml --tables stg_orders --with-downstream -o out.yaml` を実行する
- **THEN** `stg_orders` およびそこから lineage で連結されたすべての下流テーブルが `out.yaml` の `tables` セクションに含まれる

#### Scenario: --with-downstream なしの場合は従来通り
- **WHEN** `--with-downstream` フラグを指定せずに `extract` を実行する
- **THEN** `--tables` で指定したテーブルのみが出力に含まれる（既存動作を変えない）

#### Scenario: 下流テーブルが存在しない場合
- **WHEN** lineage に下流テーブルが存在しないテーブルに対して `--with-downstream` を指定する
- **THEN** 指定テーブルのみが出力に含まれ、警告は表示されない

#### Scenario: 多段下流を再帰的に追跡する
- **WHEN** A → B → C の lineage が存在し、`--tables A --with-downstream` を実行する
- **THEN** A・B・C の3テーブルがすべて出力に含まれる
