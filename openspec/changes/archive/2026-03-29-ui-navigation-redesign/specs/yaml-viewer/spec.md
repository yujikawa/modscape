## MODIFIED Requirements

### Requirement: 左パネルのタブ構成
左パネルのタブは「YAML」「Stats」の2タブ構成にしなければならない（SHALL）。Connect タブは削除しなければならない（SHALL）。Stats タブは Model Stats（ホットスポット・孤立テーブル・集計数）を表示しなければならない（SHALL）。

#### Scenario: 左パネルに YAML と Stats の2タブが存在する
- **WHEN** ユーザーが左パネルを開く
- **THEN** YAML タブと Stats タブの2つのタブのみが表示される

#### Scenario: Stats タブでモデル統計が閲覧できる
- **WHEN** ユーザーが Stats タブを選択する
- **THEN** テーブル数・リレーション数・Lineage数・ドメイン数の集計と、Lineageホットスポット一覧、孤立テーブル一覧が表示される
