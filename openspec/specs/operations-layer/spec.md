## ADDED Requirements

### Requirement: オペレーション関数の共通化
システムはtable/column/relationship/lineage/domainの操作ロジックを `src/operations/` 配下の純粋な関数として提供しなければならない（SHALL）。CLIコマンドとMCPサーバーの両方がこれらの関数を呼び出す。

#### Scenario: CLIとMCPが同一の関数を使う
- **WHEN** `modscape table add` コマンドと `add_table` MCPツールが同じテーブルを追加する
- **THEN** 両方とも同一のops関数を経由し、同一のYAML出力が得られる

### Requirement: opsエラーはExceptionで伝達する
オペレーション関数は失敗時にErrorをthrowしなければならない（SHALL）。CLIレイヤーとMCPレイヤーがそれぞれのフォーマットに変換して出力する。

#### Scenario: 存在しないIDへの操作
- **WHEN** ops関数に存在しないIDを渡す
- **THEN** 適切なエラーメッセージのErrorがthrowされる

#### Scenario: CLIがエラーを受け取る
- **WHEN** CLIラッパーがops関数のErrorをcatchする
- **THEN** `outputError()` を使ってCLI形式で出力し終了コード1で終了する

#### Scenario: MCPがエラーを受け取る
- **WHEN** MCPツールハンドラーがops関数のErrorをcatchする
- **THEN** `{ isError: true, content: [{ type: "text", text: error.message }] }` を返す

### Requirement: CLIの外部インターフェース不変
operations層へのリファクタリング後も、既存CLIコマンドの引数・オプション・出力形式は変更してはならない（SHALL NOT）。

#### Scenario: 既存CLIコマンドが動作し続ける
- **WHEN** リファクタリング後に `modscape table add model.yaml --id foo --name Foo` を実行する
- **THEN** リファクタリング前と同じYAMLが出力される
