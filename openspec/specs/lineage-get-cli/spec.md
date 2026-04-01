## ADDED Requirements

### Requirement: `modscape lineage get` コマンド
`modscape lineage get <file>` コマンドは、`--id` または `--from`/`--to` で指定した1件のリネージエントリを返さなければならない（SHALL）。
`--json` フラグで JSON オブジェクトを出力しなければならない（SHALL）。

#### Scenario: --id で1件取得できる
- **WHEN** `modscape lineage get model.yaml --id lin-xxx` を実行する
- **THEN** 該当リネージエントリの詳細が出力される

#### Scenario: --from / --to で1件取得できる
- **WHEN** `modscape lineage get model.yaml --from a --to b` を実行する
- **THEN** 該当リネージエントリの詳細が出力される

#### Scenario: 存在しない ID を指定するとエラーになる
- **WHEN** 存在しない `--id` を指定して `lineage get` を実行する
- **THEN** エラーメッセージが出力され、終了コード 1 で終了する

#### Scenario: --json フラグで JSON 出力される
- **WHEN** `modscape lineage get model.yaml --id lin-xxx --json` を実行する
- **THEN** リネージエントリオブジェクトが JSON 形式で出力される
