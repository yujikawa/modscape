## ADDED Requirements

### Requirement: Relationship に description フィールドを追加
`relationships[]` の各エントリはオプションフィールド `description` を持てなければならない（SHALL）。
`description` が省略された既存エントリは引き続き正常に動作しなければならない（SHALL）。
これにより `lineage[].description` との対称性が確立される。

#### Scenario: description なしの既存エントリが動作する
- **WHEN** `description` フィールドを持たないリレーションシップエントリが YAML に存在する
- **THEN** パーサーはエラーなく処理し、キャンバスは正常にエッジを描画する

#### Scenario: description ありのエントリを YAML に書ける
- **WHEN** ユーザーが `description: "Customer's historical orders"` をリレーションシップエントリに追加する
- **THEN** YAML パースが正常に完了し、description がモデルに保持される

### Requirement: Detail Panel での Relationship description の表示と編集
リレーションシップエッジをクリックしたとき、Detail Panel に `description` を表示・編集できなければならない（SHALL）。
編集した内容は YAML に書き戻されなければならない（SHALL）。

#### Scenario: description ありエッジをクリックすると Detail Panel に表示される
- **WHEN** ユーザーが `description` を持つリレーションシップエッジをクリックする
- **THEN** Detail Panel に description の内容が表示される

#### Scenario: Detail Panel で description を編集すると YAML に反映される
- **WHEN** ユーザーが Detail Panel の description 入力欄を編集してフォーカスを外す
- **THEN** YAML の該当リレーションシップエントリの `description` が更新される

#### Scenario: description なしエッジをクリックすると Detail Panel に空の入力欄が表示される
- **WHEN** ユーザーが `description` を持たないリレーションシップエッジをクリックする
- **THEN** Detail Panel に description の空の入力欄が表示される

### Requirement: CLI `relationship add/update` の `--description` サポート
`modscape relationship add` コマンドは `--description` オプションを受け付けなければならない（SHALL）。
`modscape relationship update` コマンドは `--description` オプションで既存エントリの説明を更新できなければならない（SHALL）。

#### Scenario: relationship add --description で description を付けて追加できる
- **WHEN** `modscape relationship add model.yaml --from a --to b --type one-to-many --description "..."` を実行する
- **THEN** YAML に `description` フィールドを含むリレーションシップエントリが追加される

#### Scenario: relationship update --description で既存エントリの description を更新できる
- **WHEN** `modscape relationship update model.yaml --id rel-xxx --description "新しい説明"` を実行する
- **THEN** 該当エントリの `description` が更新される

#### Scenario: --description に空文字を渡すと description フィールドが削除される
- **WHEN** `modscape relationship update model.yaml --id rel-xxx --description ""` を実行する
- **THEN** 該当エントリから `description` フィールドが削除される
