## 1. annotation CRUD — operationsロジック

- [x] 1.1 `src/operations/annotation.js` を新規作成し、`listAnnotations(file)` を実装する
- [x] 1.2 `addAnnotation(file, { id, type, text, color, targetId, targetType, offset })` を実装する（id省略時は `note-{timestamp}` 自動生成、重複IDチェックあり）
- [x] 1.3 `updateAnnotation(file, { id, ...fields })` を実装する（存在しないIDはエラー）
- [x] 1.4 `removeAnnotation(file, id)` を実装する（存在しないIDはエラー）

## 2. annotation CRUD — CLIコマンド

- [x] 2.1 `src/cli.js` に `annotationCommand()` を追加し、`list / add / update / remove` サブコマンドを実装する（`--json` フラグ対応）
- [x] 2.2 `src/index.js` に `annotationCommand` をインポートして登録する

## 3. annotation CRUD — MCPツール

- [x] 3.1 `src/mcp.js` に `list_annotations` ツールを追加する
- [x] 3.2 `src/mcp.js` に `add_annotation` ツールを追加する
- [x] 3.3 `src/mcp.js` に `update_annotation` ツールを追加する
- [x] 3.4 `src/mcp.js` に `remove_annotation` ツールを追加する

## 4. model-summary — operationsロジック

- [x] 4.1 `src/operations/summarize.js` を新規作成し、`summarizeModel(file)` を実装する（`tableCount`, `byType`, `domainCount`, `domains`, `orphanTableIds`, `relationshipCount`, `lineageCount`, `annotationCount`）

## 5. model-summary — CLIコマンド

- [x] 5.1 `src/cli.js` または新規ファイルに `summaryCommand()` を追加し、人間可読出力と `--json` フラグに対応する
- [x] 5.2 `src/index.js` に `summary` コマンドを登録する

## 6. model-summary — MCPツール

- [x] 6.1 `src/mcp.js` に `summarize_model` ツールを追加する

## 7. table list フィルター — operationsロジック拡張

- [x] 7.1 `src/operations/table.js` の `listTables(file, options)` に `{ type, domainId, orphanOnly }` オプション引数を追加する
- [x] 7.2 `--orphan` フィルターの判定ロジックを実装する（`domains[].members` を参照）

## 8. table list フィルター — CLIコマンド拡張

- [x] 8.1 `src/cli.js` の `table list` コマンドに `--type <type>`, `--domain <id>`, `--orphan` オプションを追加する

## 9. table list フィルター — MCPツール拡張

- [x] 9.1 `src/mcp.js` の `list_tables` ツールに `type`, `domain_id`, `orphan_only` の任意引数を追加する

## 10. ドキュメント更新

- [x] 10.1 `src/templates/rules.md` の Section 13（CLI Flag Reference）を更新する
- [x] 10.2 `README.md` のCLIリファレンスセクションに新コマンドを追記する
- [x] 10.3 `README.ja.md` のCLIリファレンスセクションに新コマンドを追記する
- [x] 10.4 `CHANGELOG.md` に変更履歴を追記する

## 11. テスト

- [x] 11.1 `tests/ai-collaboration-tools.spec.ts` を作成し、annotation CRUD / summary / table list フィルターの全ケースをカバーするテストを実装する（23テスト）
