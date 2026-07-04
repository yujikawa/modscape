### Requirement: OSI フォーマットへのエクスポート
`modscape export --format osi` コマンドを実行すると、Modscape YAML ファイルを OSI（Open Semantic Interchange）フォーマットの YAML ファイルに変換して出力しなければならない（SHALL）。

#### Scenario: 基本的なエクスポート
- **WHEN** ユーザーが `modscape export --format osi model.yaml` を実行する
- **THEN** 同ディレクトリに `model.osi.yaml` が生成される

#### Scenario: 出力先の指定
- **WHEN** ユーザーが `modscape export --format osi model.yaml --output out.yaml` を実行する
- **THEN** 指定したパス `out.yaml` にファイルが生成される

---

### Requirement: tables → datasets マッピング
Modscape の `tables[]` エントリは OSI の `semantic_model[].datasets[]` に変換されなければならない（SHALL）。

#### Scenario: physical name の使用
- **WHEN** テーブルが `physical.name` を持つ
- **THEN** OSI の `datasets[].name` および `datasets[].source` に `physical.name` の値が設定される

#### Scenario: conceptual name の説明への変換
- **WHEN** テーブルが `conceptual.name` を持つ
- **THEN** OSI の `datasets[].description` に `conceptual.name` の値が設定される

#### Scenario: primary key の収集
- **WHEN** テーブルのカラムに `isPrimaryKey: true` が設定されている
- **THEN** そのカラムの ID が OSI の `datasets[].primary_key[]` に含まれる

---

### Requirement: columns → fields マッピング
Modscape の `columns[]` は OSI の `datasets[].fields[]` に変換されなければならない（SHALL）。

#### Scenario: フィールド名の変換
- **WHEN** カラムが `id` フィールドを持つ
- **THEN** OSI の `fields[].name` にカラムの `id` が設定される

#### Scenario: expression の ANSI_SQL 設定
- **WHEN** カラムが変換される
- **THEN** OSI の `fields[].expression.ANSI_SQL` にカラムの `id` の値が設定される

---

### Requirement: relationships マッピング
Modscape の `relationships[]` は OSI の `semantic_model[].relationships[]` に変換されなければならない（SHALL）。

#### Scenario: from/to の変換
- **WHEN** リレーションシップが `from.table`・`from.column[]`・`to.table`・`to.column[]` を持つ
- **THEN** OSI の `relationships[].from`・`from_columns[]`・`to`・`to_columns[]` にそれぞれマッピングされる

#### Scenario: リレーションシップ名の生成
- **WHEN** Modscape のリレーションシップが `id` を持つ
- **THEN** その `id` を OSI の `relationships[].name` に使用する

---

### Requirement: metrics マッピング
Modscape の `metrics[]` は OSI の `semantic_model[].metrics[]` に変換されなければならない（SHALL）。

#### Scenario: メトリクスの基本変換
- **WHEN** メトリクスが `id`・`name`・`description`・`expression` を持つ
- **THEN** OSI の `metrics[].name` に `name`、`metrics[].description` に `description` が設定される

#### Scenario: expression の ANSI_SQL 固定
- **WHEN** メトリクスが `expression` を持つ
- **THEN** OSI の `metrics[].expression.ANSI_SQL` に Modscape の `expression` 文字列が設定される

---

### Requirement: Modscape 固有メタデータの保存
OSI に対応フィールドがない Modscape 固有の情報は `custom_extensions.modscape` に保存されなければならない（SHALL）。

#### Scenario: kind の保存
- **WHEN** テーブルの `conceptual.kind` が設定されている（hub/link/sat/fact/dimension 等）
- **THEN** 対応する OSI dataset の `custom_extensions.modscape.kind` に値が設定される

#### Scenario: domain の保存
- **WHEN** テーブルが `domains[]` のいずれかの `members` に含まれている
- **THEN** 対応する OSI dataset の `custom_extensions.modscape.domain` にドメイン ID が設定される

---

### Requirement: imports の解決
`imports:` による複数ファイル参照は変換前に解決してマージされなければならない（SHALL）。

#### Scenario: imports を含むファイルのエクスポート
- **WHEN** `model.yaml` が `imports:` で他の YAML ファイルを参照している
- **THEN** 参照先のテーブルも解決され、単一の OSI ファイルに含まれる

---

### Requirement: 変換対象外フィールドの除外
`display`・`sampleData` は OSI 出力に含まれてはならない（SHALL NOT）。

#### Scenario: display の除外
- **WHEN** テーブルが `display`（color, icon 等）を持つ
- **THEN** OSI 出力に `display` の情報は含まれない

#### Scenario: sampleData の除外
- **WHEN** テーブルが `sampleData` を持つ
- **THEN** OSI 出力に `sampleData` の情報は含まれない
