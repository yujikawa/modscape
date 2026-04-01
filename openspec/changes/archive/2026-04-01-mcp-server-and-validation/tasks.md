## 1. 依存パッケージの追加

- [x] 1.1 `@modelcontextprotocol/sdk` を package.json の dependencies に追加する（既にinstall済みのため package.json への明記のみ）
- [x] 1.2 `zod` を package.json の dependencies に追加する（既にinstall済みのため package.json への明記のみ）

## 2. オペレーション層の作成

- [x] 2.1 `src/operations/table.js` を作成する（listTables, getTable, addTable, updateTable, removeTable）
- [x] 2.2 `src/operations/column.js` を作成する（listColumns, addColumn, updateColumn, removeColumn）
- [x] 2.3 `src/operations/relationship.js` を作成する（listRelationships, addRelationship, removeRelationship）
- [x] 2.4 `src/operations/lineage.js` を作成する（listLineages, addLineage, removeLineage）
- [x] 2.5 `src/operations/domain.js` を作成する（listDomains, getDomain, addDomain, updateDomain, removeDomain, addDomainMember, removeDomainMember）

## 3. CLIの一本化

- [x] 3.1 `src/cli.js` を新規作成し、全CLIコマンド定義を移植する（`src/operations/*` を呼び出す形で）
- [x] 3.2 `src/index.js` を `cli.js` を呼ぶ形に更新し、旧 `table.js`, `column.js`, `relationship.js`, `lineage.js`, `domain.js` の import を削除する
- [x] 3.3 旧 `src/table.js`, `src/column.js`, `src/relationship.js`, `src/lineage.js`, `src/domain.js` を削除する
- [x] 3.4 既存CLIの動作確認（各コマンドがリファクタリング前と同一の出力を返すことを確認）

## 4. バリデーション機能の実装

- [x] 4.1 `src/validate.js` を作成する（validateModel関数）
- [x] 4.2 チェック実装: ID重複チェック（tables/domains/relationships/lineage）
- [x] 4.3 チェック実装: 座標配置チェック（tables/domainsにx/y/width/heightが混入していないか）
- [x] 4.4 チェック実装: 参照整合性チェック（relationships・lineage・domains.members・layoutの参照先が存在するか）
- [x] 4.5 チェック実装: 座標グリッドチェック（layout内のx/yが40の倍数か、warning扱い）
- [x] 4.6 `src/index.js` に `modscape validate <file> [--json]` コマンドを登録する

## 5. MCPサーバーの実装

- [x] 5.1 `src/mcp.js` を operations層を使う形に全面的に書き直す（現在のプロトタイプを置き換える）
- [x] 5.2 テーブル操作ツールを実装する（list_tables, get_table, add_table, update_table, remove_table）
- [x] 5.3 カラム操作ツールを実装する（list_columns, add_column, update_column, remove_column）
- [x] 5.4 リレーションシップ操作ツールを実装する（list_relationships, add_relationship, remove_relationship）
- [x] 5.5 リネージ操作ツールを実装する（list_lineages, add_lineage, remove_lineage）
- [x] 5.6 ドメイン操作ツールを実装する（list_domains, add_domain, remove_domain, add_domain_member, remove_domain_member）
- [x] 5.7 バリデーションツールを実装する（validate）
- [x] 5.8 MCPサーバーの動作確認（JSON-RPC経由でツール呼び出しが正常に動作するか確認）

## 6. init コマンドの更新

- [x] 6.1 `src/init.js` の Claude Code 向け処理完了後にMCPセットアップ案内メッセージを追加する

## 7. ドキュメント更新

- [x] 7.1 `README.md` に `modscape mcp` と `modscape validate` コマンドを追記する
- [x] 7.2 `README.ja.md` に同上を追記する
- [x] 7.3 `src/templates/rules.md` のSection 13（CLI Flag Reference）に `validate` コマンドを追記する
- [x] 7.4 `CHANGELOG.md` に変更内容を追記する
