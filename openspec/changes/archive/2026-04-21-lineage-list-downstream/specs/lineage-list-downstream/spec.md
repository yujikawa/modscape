## ADDED Requirements

### Requirement: lineage list に --from フィルターで下流エントリを絞り込める
`modscape lineage list <file> --from <tableId>` は指定テーブルを起点とする直接の下流エントリのみを返さなければならない（SHALL）。`--from` を指定しない場合は従来どおり全エントリを返す（SHALL）。

#### Scenario: --from で直接の下流を絞り込む
- **WHEN** `modscape lineage list model.yaml --from fct_orders` を実行する
- **THEN** `from: fct_orders` のエントリのみが出力される

#### Scenario: --from に一致するエントリがない場合
- **WHEN** `modscape lineage list model.yaml --from unknown_table` を実行する
- **THEN** 空の結果を返しエラーにしない

### Requirement: --recursive で下流を再帰的に全件取得できる
`modscape lineage list <file> --from <tableId> --recursive` は指定テーブルを起点にBFSで全下流エントリを取得しなければならない（SHALL）。各エントリには起点からの深さ（`depth`）を付与しなければならない（SHALL）。循環参照が存在する場合は無限ループにならずに処理を完了しなければならない（SHALL）。

#### Scenario: 2段階の下流を再帰取得する
- **WHEN** lineage が `fct_orders → mart_revenue → mart_summary` の構造で `modscape lineage list model.yaml --from fct_orders --recursive` を実行する
- **THEN** `fct_orders → mart_revenue (depth: 1)` と `mart_revenue → mart_summary (depth: 2)` の両エントリが出力される

#### Scenario: --depth で再帰の深さを制限する
- **WHEN** `modscape lineage list model.yaml --from fct_orders --recursive --depth 1` を実行する
- **THEN** depth 1 のエントリのみが出力され、depth 2 以降は含まれない

#### Scenario: 循環参照があっても無限ループにならない
- **WHEN** lineage に `A → B → A` の循環が存在する状態で `--recursive` を実行する
- **THEN** 各エントリが1度だけ出力されて正常終了する

#### Scenario: --recursive --json で機械可読な出力が得られる
- **WHEN** `modscape lineage list model.yaml --from fct_orders --recursive --json` を実行する
- **THEN** `[{ "from": "fct_orders", "to": "mart_revenue", "depth": 1, ... }, ...]` の形式のJSON配列が出力される
