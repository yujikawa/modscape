### Requirement: extract コマンドの基本動作
CLI は `extract <source...> --tables <ids> [-o <output>]` コマンドを提供しなければならない（SHALL）。`--tables` にはカンマ区切りのテーブル ID を指定する。指定された ID に一致するテーブルのみを出力 YAML の `tables` セクションに含める。

#### Scenario: 単一ファイルから1テーブル抽出
- **WHEN** `modscape extract common.yaml --tables dim_customers -o out.yaml` を実行する
- **THEN** `out.yaml` には `id: dim_customers` のテーブルのみが含まれる

#### Scenario: 複数 ID をカンマ区切りで指定
- **WHEN** `--tables dim_customers,dim_products` を指定する
- **THEN** 両方のテーブルが出力に含まれる

#### Scenario: ディレクトリを入力として指定
- **WHEN** ソースにディレクトリを指定する
- **THEN** ディレクトリ内の全 YAML ファイルを対象として ID フィルタを適用する

### Requirement: 後勝ちマージ
同一 ID のテーブルが複数ソースファイルに存在する場合、後から処理されたファイルの定義で上書きしなければならない（SHALL）。

#### Scenario: 同一 ID が複数ファイルに存在する
- **WHEN** `file_a.yaml` と `file_b.yaml` の両方に `id: dim_customers` が存在し、`file_b.yaml` を後に指定する
- **THEN** 出力の `dim_customers` は `file_b.yaml` の定義になる

### Requirement: 出力セクションの制限
出力 YAML には `tables` セクションのみを含めなければならない（SHALL）。`relationships` / `domains` / `lineage` / `annotations` / `layout` は出力に含めてはならない（SHALL NOT）。ただし `--with-downstream` フラグを指定した場合は、下流トラバーサルに使用するために `lineage` セクションを読み込むが、出力 YAML には含めない（SHALL NOT）。

#### Scenario: relationships を含むソースファイルから抽出
- **WHEN** relationships を持つ YAML から extract する
- **THEN** 出力 YAML に relationships キーは存在しない

#### Scenario: --with-downstream 指定時も lineage は出力に含まない
- **WHEN** `--with-downstream` フラグを指定して extract する
- **THEN** 出力 YAML に lineage キーは存在しない（下流テーブルの tables エントリのみ出力される）

### Requirement: マッチしない ID の警告
`--tables` に指定した ID がいずれのソースファイルにも存在しない場合、警告メッセージを出力しなければならない（SHALL）。

#### Scenario: 存在しない ID を指定
- **WHEN** `--tables nonexistent_id` を指定する
- **THEN** `nonexistent_id` に対して warning が標準エラー出力に表示される
- **THEN** 出力ファイルには空の `tables` が生成される（エラー終了しない）

### Requirement: デフォルト出力ファイル名
`-o` オプションを省略した場合、出力ファイル名は `extracted.yaml` でなければならない（SHALL）。

#### Scenario: -o を省略して実行
- **WHEN** `-o` オプションなしで extract を実行する
- **THEN** カレントディレクトリに `extracted.yaml` が生成される
