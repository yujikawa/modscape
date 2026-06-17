## ADDED Requirements

### Requirement: Designタブのサブナビゲーションをサイドバーリストで表示する

`spec dev` の SpecPanel コンポーネントにおいて、Designタブがアクティブかつ `design/<table-id>.md` ファイルが1件以上存在する場合、サブナビゲーションは横スクロールタブではなく、左サイドバーのリスト形式で表示されなければならない（SHALL）。サイドバーの幅は 150px 固定とし、縦スクロール可能でなければならない（SHALL）。

#### Scenario: Designタブ表示時にサイドバーが表示される

- **WHEN** SpecPanel で Design タブをクリックし、`design/<table-id>.md` が2件以上存在する場合
- **THEN** コンテンツエリアが左サイドバー（150px）と右 iframe 表示域（残り幅）の横並びレイアウトになる

#### Scenario: サイドバーに Overview とテーブル一覧が表示される

- **WHEN** Designタブのサイドバーが表示される場合
- **THEN** サイドバーの先頭に「Overview」、その下に各 `<table-id>` がリスト項目として縦に並ぶ

#### Scenario: 選択中アイテムがハイライトされる

- **WHEN** サイドバーのリスト項目をクリックした場合
- **THEN** 選択中項目は青ハイライト背景（light: `#eff6ff` / dark: `#1e3a5f`）でその他と区別される

#### Scenario: テーブル数が多い場合にサイドバーが縦スクロールする

- **WHEN** テーブルが 10件以上あり、サイドバーの高さを超える場合
- **THEN** サイドバーのみ縦スクロールし、iframe 表示域は影響を受けない

#### Scenario: design/<table-id>.md が0件の場合はサイドバーを表示しない

- **WHEN** Designタブがアクティブだが `design/` ディレクトリにファイルが存在しない場合
- **THEN** サイドバーは表示されず、Overview コンテンツが全幅で表示される
