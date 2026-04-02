## ADDED Requirements

### Requirement: `modscape relationship get` コマンド
`modscape relationship get <file>` コマンドは、`--id` または `--from`/`--to` で指定した1件のリレーションシップを返さなければならない（SHALL）。
`--json` フラグで JSON オブジェクトを出力しなければならない（SHALL）。

#### Scenario: --id で1件取得できる
- **WHEN** `modscape relationship get model.yaml --id rel-xxx` を実行する
- **THEN** 該当リレーションシップの詳細が出力される

#### Scenario: --from / --to で1件取得できる
- **WHEN** `modscape relationship get model.yaml --from a --to b` を実行する
- **THEN** 該当リレーションシップの詳細が出力される

#### Scenario: 存在しない ID を指定するとエラーになる
- **WHEN** 存在しない `--id` を指定して `relationship get` を実行する
- **THEN** エラーメッセージが出力され、終了コード 1 で終了する

#### Scenario: --json フラグで JSON 出力される
- **WHEN** `modscape relationship get model.yaml --id rel-xxx --json` を実行する
- **THEN** リレーションシップオブジェクトが JSON 形式で出力される

### Requirement: `modscape relationship update` コマンド
`modscape relationship update <file>` コマンドは、`--id` または `--from`/`--to` で対象を特定し、`--type` / `--description` で更新できなければならない（SHALL）。

#### Scenario: --type で関係性タイプを更新できる
- **WHEN** `modscape relationship update model.yaml --id rel-xxx --type one-to-one` を実行する
- **THEN** YAML の該当エントリの `type` が `one-to-one` に更新される

#### Scenario: --description で説明を更新できる
- **WHEN** `modscape relationship update model.yaml --id rel-xxx --description "新しい説明"` を実行する
- **THEN** YAML の該当エントリの `description` が更新される

#### Scenario: 同テーブル間に複数リレーションシップがある場合は --id を必須とする
- **WHEN** 同じ `from`/`to` テーブル間に複数のリレーションシップが存在し、`--from`/`--to` のみで `relationship update` を実行する
- **THEN** エラーメッセージで `--id` の指定を促し、YAML は変更されない

#### Scenario: 存在しないエントリを指定するとエラーになる
- **WHEN** 存在しない `--id` を指定して `relationship update` を実行する
- **THEN** エラーメッセージが出力され、YAML は変更されない
