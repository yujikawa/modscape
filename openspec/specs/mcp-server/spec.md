## ADDED Requirements

### Requirement: MCPサーバー起動コマンド
システムは `modscape mcp` コマンドを提供しなければならない（SHALL）。stdio transportでMCPサーバーを起動し、Claude CodeなどのMCPクライアントと通信する。

#### Scenario: MCPサーバーが起動する
- **WHEN** `modscape mcp` を実行する
- **THEN** stdioでMCPプロトコルのハンドシェイクが成立し、ツール一覧が返せる状態になる

### Requirement: テーブル操作ツール
MCPサーバーはテーブルの一覧・取得・追加・更新・削除ツールを提供しなければならない（SHALL）。

#### Scenario: list_tables でテーブル一覧を取得する
- **WHEN** `list_tables` ツールを `file` パラメータ付きで呼び出す
- **THEN** ファイル内の全テーブルのid・name・typeを含むJSON配列が返る

#### Scenario: add_table で新規テーブルを追加する
- **WHEN** `add_table` ツールを `file`, `id`, `name` パラメータ付きで呼び出す
- **THEN** 指定YAMLのtablesセクションにテーブルが追加される

#### Scenario: 既存IDで add_table を呼ぶ
- **WHEN** 既に存在するIDで `add_table` を呼ぶ
- **THEN** isError: true でエラーメッセージが返る（ファイルは変更されない）

#### Scenario: update_table で既存テーブルを更新する
- **WHEN** `update_table` ツールを存在するIDで呼ぶ
- **THEN** 指定フィールドが更新される

#### Scenario: remove_table でテーブルを削除する
- **WHEN** `remove_table` ツールを存在するIDで呼ぶ
- **THEN** tablesからそのテーブルが削除される

### Requirement: カラム操作ツール
MCPサーバーはカラムの一覧・追加・更新・削除ツールを提供しなければならない（SHALL）。

#### Scenario: add_column でカラムを追加する
- **WHEN** `add_column` ツールを `file`, `table_id`, `id`, `name` パラメータ付きで呼ぶ
- **THEN** 指定テーブルのcolumnsにカラムが追加される

#### Scenario: 存在しないテーブルIDを指定する
- **WHEN** 存在しないtable_idで `add_column` を呼ぶ
- **THEN** isError: true でエラーメッセージが返る

### Requirement: リレーションシップ操作ツール
MCPサーバーはリレーションシップの一覧・追加・削除ツールを提供しなければならない（SHALL）。

#### Scenario: add_relationship でリレーションを追加する
- **WHEN** `add_relationship` ツールを正しいパラメータで呼ぶ
- **THEN** relationshipsセクションにエントリが追加される

### Requirement: ドメイン操作ツール
MCPサーバーはドメインの一覧・追加・削除・メンバー操作ツールを提供しなければならない（SHALL）。

#### Scenario: add_domain でドメインを追加する
- **WHEN** `add_domain` ツールを `file`, `id`, `name`, `color` パラメータで呼ぶ
- **THEN** domainsセクションにドメインが追加される

#### Scenario: add_domain_member でメンバーを追加する
- **WHEN** `add_domain_member` ツールを `file`, `domain_id`, `table_id` で呼ぶ
- **THEN** 指定ドメインのmembersにtable_idが追加される

### Requirement: バリデーションツール
MCPサーバーは `validate` ツールを提供しなければならない（SHALL）。

#### Scenario: 正常なYAMLをバリデートする
- **WHEN** `validate` ツールを有効なmodel.yamlに対して呼ぶ
- **THEN** `{ "valid": true, "errors": [], "warnings": [] }` が返る

#### Scenario: 不正なYAMLをバリデートする
- **WHEN** `validate` ツールを構造エラーのあるファイルに対して呼ぶ
- **THEN** `valid: false` と具体的なエラーの配列が返る
