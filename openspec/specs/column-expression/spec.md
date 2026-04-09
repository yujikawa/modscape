## ADDED Requirements

### Requirement: 列に SQL 変換式を記述できる
各テーブルの列定義（`columns[]`）に `expression` フィールドを追加し、その列が上流からどのように導出されるかを SQL 式で記述できなければならない（SHALL）。

`expression` は以下の用途で使用される（SHALL）:
- SDD implement スキルが SQL の SELECT 句を生成する際の変換式として参照する
- 既存 SQL からの逆引き時に AI が抽出して書き込む
- 新規設計時に AI が提案し、ユーザーが確認・修正する

`expression` は以下の制約を満たさなければならない（SHALL）:
- 列ごとに1つの文字列値
- 空文字は無効（設定する場合は有効な SQL 式であること）
- ツール固有構文（`{{ source() }}` 等）を含む自由記述を許容する
- 省略可能（既存 YAML との後方互換を維持する）

#### Scenario: expression を持つ列から SELECT 句を生成する
- **WHEN** `columns[].expression` が設定されている列が存在する
- **THEN** SDD implement スキルはその式を SELECT 句の変換式として使用し、AIによる推測なしに SQL を生成する

#### Scenario: expression がない列は従来通り処理する
- **WHEN** `columns[].expression` が設定されていない列が存在する
- **THEN** SDD implement スキルは従来通り `logical.name` / `physical.name` から推測してコードを生成する（後退互換）

#### Scenario: 複数ソース列を参照する式を記述できる
- **WHEN** `expression: "CAST(raw.orders.amount AS DECIMAL(18,2)) * fx.rate"` のように複数列を参照する式を設定する
- **THEN** YAML のバリデーションはエラーを出さず、式をそのまま保持する
