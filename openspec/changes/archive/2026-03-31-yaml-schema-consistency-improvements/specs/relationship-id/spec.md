## ADDED Requirements

### Requirement: Relationship ID フィールド（パーサー自動生成フォールバック）

`relationships` の各エントリは `id` フィールドを持つ。
`id` が YAML に記述されていない場合、パーサーは `rel-{from.table}.{from.column}-{to.table}.{to.column}` の形式で決定論的に自動生成する（カラムがない場合は `rel-{from.table}-{to.table}`）。
自動生成された `id` は YAML ファイルには書き戻さない。

#### Scenario: id ありの relationship がキャンバスに表示される
- **WHEN** relationship エントリに `id: rel_cust_orders` が指定されている
- **THEN** Cytoscape エッジの data.id が `"rel_cust_orders"` になる

#### Scenario: id なしの relationship はパーサーが決定論的に id を生成する（カラムあり）
- **WHEN** relationship エントリに `id` が指定されておらず、`column` が指定されている
- **THEN** パーサーが `rel-dim_customers.customer_key-fct_orders.customer_key` 等の決定論的 id を付与する

#### Scenario: id なしの relationship はパーサーが決定論的に id を生成する（カラムなし）
- **WHEN** relationship エントリに `id` も `column` も指定されていない
- **THEN** パーサーが `rel-{from.table}-{to.table}-{type}` 形式（例: `rel-fct_orders-dim_customers-many-to-one`）で id を付与する

### Requirement: Lineage ID フィールド（パーサー自動生成フォールバック）

`lineage` の各エントリは `id` フィールドを持つ。
`id` が YAML に記述されていない場合、パーサーは `lin-{from}-{to}` の形式で決定論的に自動生成する（`from` が配列の場合は `lin-{from.join('+')}-{to}`）。
自動生成された `id` は YAML ファイルには書き戻さない。

#### Scenario: id ありの lineage エッジがキャンバスに表示される
- **WHEN** lineage エントリに `id: lin_orders_to_mart` が指定されている
- **THEN** Cytoscape エッジの data.id が `"lin_orders_to_mart"` になる

#### Scenario: id なしの lineage はパーサーが決定論的に id を生成する
- **WHEN** lineage エントリに `id` が指定されていない
- **THEN** パーサーが `lin-fct_orders-mart_revenue` 等の決定論的 id を付与し、Cytoscape エッジの data.id に使用する

### Requirement: CLI の relationship / lineage dedup ロジックを id ベースに統一

`relationship add` / `lineage add` コマンドは常に `id` で重複チェックを行う。
`--id` オプションが省略された場合、コマンドが上記ルールで `id` を自動生成して YAML に書き込む。

これにより、同一テーブル間に異なるカラムペアの relationship を複数登録できる。

#### Scenario: 同一テーブル間に2本の relationship を登録できる
- **WHEN** `orders → customers` の relationship が `id: rel_billing` で既に存在する状態で、異なるカラムペアの `id: rel_shipping` の relationship を追加する
- **THEN** 2本目の relationship が正常に追加され、YAML に両方のエントリが存在する

#### Scenario: 同一 id の relationship は重複として扱われる
- **WHEN** `id: rel_001` の relationship が既に存在する状態で、同じ `id: rel_001` の relationship を追加しようとする
- **THEN** システムは `"already exists"` 警告を出力し、追加をスキップする

#### Scenario: --id 省略時はコマンドが id を自動生成して YAML に書き込む
- **WHEN** `modscape relationship add model.yaml --from dim_customers.customer_key --to fct_orders.customer_key --type one-to-many` を `--id` なしで実行する
- **THEN** `id: rel-dim_customers.customer_key-fct_orders.customer_key` が YAML に書き込まれる

### Requirement: relationship の column フィールドが複合キー（配列）をサポート

`relationship` の `from.column` および `to.column` は、単一文字列と文字列配列の両方を受け付ける。
パーサーは `column` を常に `string[]` に正規化する。
`column` はあくまで付属情報（表示・ドキュメント目的）であり、カラムレベルの解析には使用しない。

#### Scenario: 単一カラムの column が配列に正規化される
- **WHEN** relationship エントリの `from.column` が `"order_id"` と記述されている
- **THEN** パーサーはこれを `["order_id"]` に正規化する

#### Scenario: 複合キーを配列で表現できる
- **WHEN** relationship エントリの `from.column` が `[order_id, line_no]` と記述されている
- **THEN** パーサーはこれを `["order_id", "line_no"]` として保持する

#### Scenario: 複合キーを持つ relationship の id が自動生成される
- **WHEN** `from.column: [order_id, line_no]` を持つ relationship に `id` がない
- **THEN** パーサーが `rel-{from.table}.order_id+line_no-{to.table}.{to.columns}` 形式で id を自動生成する
