## ADDED Requirements

### Requirement: DetailPanel をフローティングウィンドウとして表示する
DetailPanel は `position:absolute` でキャンバス上にオーバーレイ表示され、Flexレイアウトに影響を与えてはならない。キャンバス領域はDetailPanelの開閉によって縮小または拡大されない。

#### Scenario: DetailPanel を開いてもキャンバスサイズが変化しない
- **WHEN** ユーザーが SelectionToolbar の「詳細を開く」ボタンをクリックする
- **THEN** DetailPanel がキャンバス上にオーバーレイで表示され、キャンバス領域のサイズは変化しない

#### Scenario: DetailPanel がキャンバス内でドラッグ移動できる
- **WHEN** ユーザーが DetailPanel のヘッダーをドラッグする
- **THEN** DetailPanel がキャンバス内の任意の位置に移動できる

#### Scenario: DetailPanel がリサイズできる
- **WHEN** ユーザーが DetailPanel のリサイズハンドルをドラッグする
- **THEN** DetailPanel のサイズが変更される

### Requirement: SelectionToolbar から DetailPanel を開閉できる
SelectionToolbar にはエンティティ選択中に「詳細を開く」ボタンが表示され、クリックで DetailPanel の表示をトグルできる。

#### Scenario: 「詳細を開く」ボタンを押して DetailPanel が開く
- **WHEN** ユーザーがノードを選択して SelectionToolbar が表示された状態で「詳細を開く」ボタンをクリックする
- **THEN** DetailPanel がフローティングウィンドウとして表示される

#### Scenario: 「詳細を開く」ボタンを再度押して DetailPanel が閉じる
- **WHEN** DetailPanel が開いている状態でユーザーが SelectionToolbar の「詳細を閉じる」ボタンをクリックする
- **THEN** DetailPanel が非表示になる

### Requirement: ノードクリック時に DetailPanel は自動で開かない
デフォルトではノードクリック時に SelectionToolbar のみが表示され、DetailPanel は開かない。

#### Scenario: ノードをクリックしても DetailPanel は表示されない
- **WHEN** ユーザーがキャンバス上のノードをクリックする
- **THEN** SelectionToolbar は表示されるが DetailPanel は表示されない

### Requirement: 選択解除時に DetailPanel が連動して閉じる
ユーザーが選択を解除した際、DetailPanel も自動的に閉じる。

#### Scenario: Esc キーで選択解除すると DetailPanel も閉じる
- **WHEN** DetailPanel が開いている状態でユーザーが Esc キーを押す
- **THEN** 選択が解除され、DetailPanel も非表示になる

#### Scenario: SelectionToolbar の × ボタンで選択解除すると DetailPanel も閉じる
- **WHEN** DetailPanel が開いている状態でユーザーが SelectionToolbar の × ボタンをクリックする
- **THEN** 選択が解除され、DetailPanel も非表示になる

#### Scenario: キャンバスの空白をクリックして選択解除すると DetailPanel も閉じる
- **WHEN** DetailPanel が開いている状態でユーザーがキャンバスの空白エリアをクリックする
- **THEN** 選択が解除され、DetailPanel も非表示になる

### Requirement: DetailPanel を開いたまま別エンティティを選択できる
DetailPanel が開いている状態で別のノードを選択すると、内容が新しいエンティティの詳細に更新される。

#### Scenario: DetailPanel 表示中に別ノードをクリックすると内容が切り替わる
- **WHEN** DetailPanel が開いていてエンティティAの詳細を表示している状態でユーザーがエンティティBをクリックする
- **THEN** DetailPanel の位置・サイズを維持したまま内容がエンティティBの詳細に更新される
