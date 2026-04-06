## ADDED Requirements

### Requirement: プロジェクト固有ルールで SDD スキルの動作を上書きできる
`.modscape/spec/modscape-spec.custom.md` が存在する場合、SDDの全スキルはこのファイルを読み込み、内容を基底ルールより優先して適用しなければならない（SHALL）。

`modscape-spec.custom.md` でカスタマイズできる内容（SHALL）:
- ターゲットツールのデフォルト値（例: 常に dbt BigQuery を使用する）
- spec.md に追加する必須フィールド（例: SLA、compliance）
- tasks.md の追加フェーズ（例: Data Contract 確認、データ品質チェック）
- コード生成時の言語・コメントスタイル
- 全体的なモデリングポリシー（例: Data Vault 2.0 パターンを使用する）

`modscape init --claude --sdd` は `modscape-spec.custom.md.example` を `.modscape/spec/` に生成しなければならない（SHALL）。このファイルはカスタマイズ可能な項目の例を記載したテンプレートとする。

#### Scenario: modscape-spec.custom.md が存在する場合にルールを優先適用する
- **WHEN** `.modscape/spec/modscape-spec.custom.md` が存在する状態でいずれかの SDD スキルを実行する
- **THEN** スキルは modscape-spec.custom.md の内容を読み込み、基底ルールと競合する場合は modscape-spec.custom.md を優先する

#### Scenario: modscape-spec.custom.md が存在しない場合に基底ルールのみで動作する
- **WHEN** `.modscape/spec/modscape-spec.custom.md` が存在しない状態でいずれかの SDD スキルを実行する
- **THEN** スキルはデフォルトの基底ルールのみで動作し、エラーを発生させない
