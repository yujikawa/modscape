## ADDED Requirements

### Requirement: Detail Panel でエッジ ID を表示する
リレーションシップまたはリネージエッジが選択されているとき、Detail Panel のヘッダー内にそのエッジの ID を表示しなければならない（SHALL）。
ユーザーはクリック操作で ID をクリップボードにコピーできなければならない（SHALL）。

#### Scenario: リレーションシップエッジを選択すると ID が表示される
- **WHEN** ユーザーがリレーションシップエッジをクリックする
- **THEN** Detail Panel のヘッダーに `ID: <value>` の形式で ID が表示される

#### Scenario: リネージエッジを選択すると ID が表示される
- **WHEN** ユーザーがリネージエッジをクリックする
- **THEN** Detail Panel のヘッダーに `ID: <value>` の形式で ID が表示される

#### Scenario: ID の横にコピーボタンが表示される
- **WHEN** エッジが選択されて Detail Panel に ID が表示されている
- **THEN** ID テキストの横にコピーボタンが表示され、クリックするとクリップボードに ID がコピーされる

#### Scenario: ノード選択時はエッジ ID 表示セクションが表示されない
- **WHEN** ユーザーがエッジではなくテーブルノードを選択する
- **THEN** Detail Panel にはテーブルの詳細が表示され、エッジ ID セクションは表示されない
