## ADDED Requirements

### Requirement: Metric YAML定義
システムはYAMLモデルのトップレベルに `metrics:` セクションをサポートしなければならない（SHALL）。各エントリは `id`・`name` を必須フィールドとし、`expression`・`description` をオプションフィールドとして持つ。

#### Scenario: 最小限のmetric定義
- **WHEN** YAMLファイルが `id` と `name` のみを持つ `metrics` エントリを含む
- **THEN** システムはエラーなくパースし、ビジュアライザーに指標ノードとしてレンダリングする

#### Scenario: 全フィールドを含むmetric定義
- **WHEN** `metrics` エントリが `id`・`name`・`expression`・`description` をすべて含む
- **THEN** すべてのフィールドがパースされ、ビジュアライザーのノードおよび詳細パネルに反映される

#### Scenario: expressionが省略された場合
- **WHEN** `metrics` エントリが `expression` を省略している
- **THEN** システムはエラーなくパースし、ビジュアライザーは計算式エリアを空白またはプレースホルダーで表示する

### Requirement: MetricのIDはモデル内で一意
システムはmetricのIDがモデル内のテーブルID・コンシューマーID・他のmetricIDと重複しないことを検証しなければならない（SHALL）。

#### Scenario: 重複IDの検出
- **WHEN** `metrics[].id` がすでに定義済みのテーブルIDまたはコンシューマーIDと同じ値を持つ
- **THEN** システムはバリデーションエラーを返す
