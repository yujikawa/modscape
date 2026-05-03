## ADDED Requirements

### Requirement: pruneコマンド
システムは `modscape prune <file>` コマンドを提供しなければならない（SHALL）。デフォルトはdry-runとして孤立エントリの一覧を表示し、`--write` フラグを指定したときのみYAMLファイルを上書き保存する。

#### Scenario: dry-runで孤立エントリを表示する
- **WHEN** `modscape prune model.yaml` を孤立エントリが存在するファイルに対して実行する
- **THEN** 削除対象のエントリ一覧（種別・ID・理由）が表示され、YAMLは変更されない

#### Scenario: 孤立エントリがない場合
- **WHEN** `modscape prune model.yaml` を孤立エントリが存在しないファイルに対して実行する
- **THEN** 「No orphaned entries found.」と表示され終了コード0で終了する

#### Scenario: --writeで実際に削除する
- **WHEN** `modscape prune model.yaml --write` を実行する
- **THEN** 孤立エントリがYAMLから削除され、ファイルが上書き保存される。削除件数がコンソールに表示される

#### Scenario: --jsonオプションで構造化出力する
- **WHEN** `modscape prune model.yaml --json` を実行する
- **THEN** `{ "orphans": [...], "removed": false }` 形式のJSONが出力される（`--write` 指定時は `"removed": true`）

### Requirement: 参照切れrelationshipの検出
`relationships` のエントリで `from.table` または `to.table` が `tables` に存在しないテーブルIDを参照している場合、pruneの対象として検出しなければならない（SHALL）。

#### Scenario: from.tableが存在しないrelationshipを検出する
- **WHEN** `relationships` のエントリの `from.table` に存在しないテーブルIDが指定されている
- **THEN** そのrelationshipが削除対象として報告される

#### Scenario: to.tableが存在しないrelationshipを検出する
- **WHEN** `relationships` のエントリの `to.table` に存在しないテーブルIDが指定されている
- **THEN** そのrelationshipが削除対象として報告される

### Requirement: 参照切れlineageの検出
`lineage` のエントリで `from` または `to` が `tables` に存在しないテーブルIDを参照している場合、pruneの対象として検出しなければならない（SHALL）。

#### Scenario: fromが存在しないlineageを検出する
- **WHEN** `lineage` のエントリの `from` に存在しないテーブルIDが指定されている
- **THEN** そのlineageエントリが削除対象として報告される

### Requirement: 参照切れlayoutエントリの検出
`layout` のキーに `tables` にも `domains` にも存在しないIDが含まれる場合、pruneの対象として検出しなければならない（SHALL）。

#### Scenario: 存在しないIDのlayoutエントリを検出する
- **WHEN** `layout` に `tables` にも `domains` にも存在しないキーが含まれている
- **THEN** そのlayoutエントリが削除対象として報告される

### Requirement: 参照切れdomain.membersの検出
`domains[].members` に `tables` に存在しないテーブルIDが含まれる場合、そのメンバーエントリをpruneの対象として検出しなければならない（SHALL）。

#### Scenario: 存在しないテーブルIDがdomain.membersに含まれる
- **WHEN** `domains[].members` に `tables` に存在しないIDが含まれている
- **THEN** そのメンバーエントリが削除対象として報告される

### Requirement: --include-isolatedオプション
`--include-isolated` フラグを指定した場合、`relationships` にも `lineage` にも登場しない孤立テーブルを検出対象に含めなければならない（SHALL）。デフォルトでは孤立テーブルは検出しない。

#### Scenario: --include-isolatedで孤立テーブルを検出する
- **WHEN** `modscape prune model.yaml --include-isolated` を実行する
- **THEN** relationshipにもlineageにも登場しないテーブルが削除対象として追加表示される

#### Scenario: デフォルトでは孤立テーブルを検出しない
- **WHEN** `modscape prune model.yaml` を実行する（`--include-isolated` なし）
- **THEN** 孤立テーブルは削除対象として表示されない

### Requirement: importsを含むモデルへの対応
`imports:` セクションを持つモデルに対して `prune` を実行する場合、インポート先のテーブルIDも解決済みとして参照整合性チェックを行わなければならない（SHALL）。

#### Scenario: importで参照されるテーブルは孤立扱いにならない
- **WHEN** `imports:` でインポートしているテーブルを参照するrelationshipに対して `prune` を実行する
- **THEN** そのrelationshipは削除対象として報告されない
