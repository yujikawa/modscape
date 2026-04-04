## 1. removeEdge のID対応

- [x] 1.1 `useStore.ts` に `removeEdgeById(id: string)` を新関数として追加（インターフェース定義 + 実装）
- [x] 1.2 `removeEdgeById` の実装：relationships と lineage をIDで検索して削除し、`syncToYamlInput()` / `saveSchema()` を呼ぶ

## 2. /del コマンドのエッジID対応

- [x] 2.1 `executeCommand` の `/del` ルーティングに relationships / lineage のIDマッチを追加（`removeEdgeById` 呼び出し）
- [x] 2.2 `/del` のTab補完候補にエッジID（relationships + lineage）を追加

## 3. /get コマンド

- [x] 3.1 `executeCommand` に `get` ルーティングを追加
- [x] 3.2 テーブルの詳細フォーマット実装（name・type・domain・columns・er・lineage を複数行で出力）
- [x] 3.3 ドメインの詳細フォーマット実装（name・members を出力）
- [x] 3.4 エッジ（relationship / lineage）の詳細フォーマット実装
- [x] 3.5 `COMMANDS` リストに `/get` を追加、Tab補完で全ノードID + エッジIDを候補に出す

## 4. /rename コマンド

- [x] 4.1 `executeCommand` に `rename` ルーティングを追加（テーブルのみ `renameTableId()` を呼ぶ、ドメインはエラー）
- [x] 4.2 `COMMANDS` リストに `/rename` を追加、第1引数でテーブルIDをTab補完

## 5. /label コマンド

- [x] 5.1 `executeCommand` に `label` ルーティングを追加（テーブルは `updateTable()`、ドメインは `updateDomain()` で name を更新）
- [x] 5.2 `COMMANDS` リストに `/label` を追加、第1引数で全ノードIDをTab補完

## 6. /col コマンド

- [x] 6.1 `executeCommand` に `col` ルーティングを追加（サブコマンド `add` / `rm` を分岐）
- [x] 6.2 `col add`：`updateTable()` で columns 配列に `{ id: colId }` を追加（重複チェックあり）
- [x] 6.3 `col rm`：`updateTable()` で columns 配列から指定IDのカラムを除外（存在チェックあり）
- [x] 6.4 `COMMANDS` リストに `/col` を追加
- [x] 6.5 Tab補完：`/col add` の第1引数でテーブルID、`/col rm` の第1引数でテーブルID・第2引数でそのテーブルのカラムIDを候補に出す

## 7. ビルド確認

- [x] 7.1 `npm run build-ui` でTypeScriptエラーなくビルドが通ることを確認
