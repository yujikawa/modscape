## ADDED Requirements

### Requirement: View ツールバーのキャンバス配置
キャンバス左上に Lineage/ER/Annotations/CompactMode/AutoLayout の操作ボタンを横並びのフローティングツールバーとして表示しなければならない（SHALL）。ツールバーはキャンバスコンテンツの上に重なるが、背景を半透明にしてキャンバス操作の邪魔にならない外観にしなければならない（SHALL）。

#### Scenario: 各トグルボタンのアクティブ状態が視覚的に区別できる
- **WHEN** Lineage エッジが表示されている状態でツールバーを見る
- **THEN** Lineage ボタンがアクティブカラー（青）で表示される

#### Scenario: ツールバーからトグル操作ができる
- **WHEN** ユーザーがツールバーの Lineage ボタンをクリックする
- **THEN** キャンバス上の Lineage エッジの表示/非表示が切り替わる

#### Scenario: Auto Layout ボタンがツールバーに存在する
- **WHEN** ユーザーがツールバーの Auto Layout ボタンをクリックする
- **THEN** キャンバスのノードが自動整列される

### Requirement: ActivityBar から View 操作の削除
ActivityBar の View セクション（Lineage/ER/Annotations/CompactMode/AutoLayout ボタン）を削除しなければならない（SHALL）。ActivityBar は Add 操作ボタンのみを含むシンプルな構成にしなければならない（SHALL）。

#### Scenario: ActivityBar に View ボタンが存在しない
- **WHEN** ユーザーが ActivityBar を見る
- **THEN** Lineage/ER/Annotations/CompactMode のトグルボタンが存在しない
