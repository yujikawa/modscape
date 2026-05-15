## MODIFIED Requirements

### Requirement: 後勝ちマージ
同一 ID のテーブルが複数ソースファイルに存在する場合、後から処理されたファイルの定義で上書きしなければならない（SHALL）。その際、上書きが発生したことを stderr に警告として出力しなければならない（SHALL）。

#### Scenario: 同一 ID が複数ファイルに存在する
- **WHEN** `file_a.yaml` と `file_b.yaml` の両方に `id: dim_customers` が存在し、`file_b.yaml` を後に指定する
- **THEN** 出力の `dim_customers` は `file_b.yaml` の定義になる

#### Scenario: 後勝ちマージ発生時に警告を出力する
- **WHEN** `file_a.yaml` と `file_b.yaml` の両方に `id: dim_customers` が存在する状態で extract を実行する
- **THEN** `WARN: dim_customers  duplicate-table-id` が stderr に出力され、どのファイルで最初に定義されどのファイルで上書きされたかが示される
