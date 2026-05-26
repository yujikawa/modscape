## ADDED Requirements

### Requirement: MetricCardノードのキャンバス表示
システムはCytoscapeキャンバス上にMetricノードを、テーブルノード・コンシューマーノードと視覚的に区別できるスタイルでレンダリングしなければならない（SHALL）。

#### Scenario: Metricノードの表示
- **WHEN** YAMLに `metrics` エントリが存在し、Lineageトグルが有効な状態でキャンバスが描画される
- **THEN** 指標ノードがキャンバス上に表示され、テーブルノードとは異なるスタイル（形状・色等）で描画される

#### Scenario: 計算式プレビューの表示
- **WHEN** `expression` フィールドを持つmetricノードがキャンバスに表示される
- **THEN** ノード内に計算式の先頭部分が表示され、ノード幅を超える場合は `...` で省略される

#### Scenario: expressionなしのMetricノード
- **WHEN** `expression` フィールドを持たないmetricノードが表示される
- **THEN** ノードは計算式エリアを空欄またはプレースホルダーで表示し、エラーにならない

### Requirement: MetricノードのクリックによるSelectionToolbar表示
ユーザーがMetricノードをクリックしたとき、システムは右上のSelectionToolbarにmetricの情報を表示しなければならない（SHALL）。

#### Scenario: Metricノードを選択する
- **WHEN** ユーザーがキャンバス上のMetricノードをクリックする
- **THEN** 右上のSelectionToolbarに対象metricの名前が表示される

### Requirement: MetricノードのDetailPanel表示
ユーザーがMetricの詳細を開いたとき、システムはDetailPanelにmetricの全情報を表示しなければならない（SHALL）。

#### Scenario: 詳細パネルで計算式全文を表示する
- **WHEN** ユーザーがSelectionToolbarまたはノードの詳細ボタンからDetailPanelを開く
- **THEN** `name`・`expression`（全文）・`description` が表示される

#### Scenario: expressionなしのDetailPanel
- **WHEN** `expression` が未定義のmetricの詳細を開く
- **THEN** expressionセクションは表示されないか空欄になり、エラーにはならない
