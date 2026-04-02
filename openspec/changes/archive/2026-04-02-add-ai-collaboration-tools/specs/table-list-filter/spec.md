## ADDED Requirements

### Requirement: タイプによるテーブル絞り込み
`table list` コマンドおよび `list_tables` MCPツールは、テーブルタイプでフィルタリングできなければならない（SHALL）。

#### Scenario: --type factで絞り込み
- **WHEN** `table list <file> --type fact` を実行する
- **THEN** `appearance.type` が `fact` のテーブルのみを返す

#### Scenario: 一致するタイプが存在しない場合
- **WHEN** 存在しないタイプを指定する
- **THEN** 空のリストを返す（エラーにはしない）

---

### Requirement: ドメインによるテーブル絞り込み
`table list` コマンドおよび `list_tables` MCPツールは、ドメインIDでフィルタリングできなければならない（SHALL）。

#### Scenario: --domain sales_opsで絞り込み
- **WHEN** `table list <file> --domain sales_ops` を実行する
- **THEN** `domains[].members` に `sales_ops` ドメインが含むテーブルIDのもののみを返す

#### Scenario: 存在しないドメインIDを指定した場合
- **WHEN** 存在しないドメインIDを `--domain` に指定する
- **THEN** 空のリストを返す（エラーにはしない）

---

### Requirement: 孤立テーブルの絞り込み
`table list` コマンドおよび `list_tables` MCPツールは、いずれのドメインにも属していないテーブルのみを返す `--orphan` フィルターをサポートしなければならない（SHALL）。

#### Scenario: --orphanフラグで絞り込み
- **WHEN** `table list <file> --orphan` を実行する
- **THEN** いずれのドメインの `members` にも含まれないテーブルのみを返す

#### Scenario: 孤立テーブルが存在しない場合
- **WHEN** 全テーブルがいずれかのドメインに属している状態で `--orphan` を実行する
- **THEN** 空のリストを返す

---

### Requirement: フィルターなし時の後方互換
フィルターオプションを何も指定しない場合、既存の動作を維持しなければならない（SHALL）。

#### Scenario: オプションなしで実行
- **WHEN** `table list <file>` をオプションなしで実行する
- **THEN** 従来通り全テーブルを返す
