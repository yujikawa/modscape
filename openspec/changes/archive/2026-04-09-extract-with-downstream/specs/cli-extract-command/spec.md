## MODIFIED Requirements

### Requirement: 出力セクションの制限
`--with-downstream` フラグを使わない場合、出力 YAML には `tables` セクションのみを含めなければならない（SHALL）。`relationships` / `domains` / `lineage` / `annotations` / `layout` は出力に含めてはならない（SHALL NOT）。

`--with-downstream` フラグを使う場合、抽出対象テーブル間に存在する `relationships` および `lineage` エントリを出力に含めなければならない（SHALL）。`domains` は抽出対象テーブルを members に含む場合のみ、該当 members を絞り込んで出力に含めなければならない（SHALL）。`layout` は抽出対象テーブルIDに対応するエントリのみ出力に含めなければならない（SHALL）。

#### Scenario: フラグなしで relationships を含むソースファイルから抽出
- **WHEN** `--with-downstream` なしで relationships を持つ YAML から extract する
- **THEN** 出力 YAML に `relationships` キーは存在しない

#### Scenario: --with-downstream で relationships が自動的に含まれる
- **WHEN** `--with-downstream` フラグありで extract し、収集されたテーブル間に relationship が存在する
- **THEN** 出力 YAML の `relationships` にその relationship エントリが含まれる
