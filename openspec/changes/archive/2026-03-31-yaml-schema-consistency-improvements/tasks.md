## 1. TypeScript 型定義の更新（schema.ts）

- [x] 1.1 `Relationship` インターフェースに `id?: string` フィールドを追加し、`type` から `'lineage'` を除去する、`from.column` / `to.column` を `string[]` に変更する
- [x] 1.2 `LineageEdge` インターフェースに `id?: string` フィールドを追加する
- [x] 1.3 `Implementation` インターフェースに `cluster_by?: string[]` を追加する
- [x] 1.4 `Schema` インターフェースに root-level `version?: string` を追加する

## 2. パーサーの更新（parser.ts）

- [x] 2.1 `Relationship.type` が `'lineage'` のエントリに対してコンソール警告を出力し、エントリを無効化する処理を追加する
- [x] 2.2 `relationship` の `from.column` / `to.column` を `string[]` に正規化する処理を追加する（文字列 → `[文字列]`）
- [x] 2.3 `id` が欠落している `relationships` エントリに対して決定論的 id を自動生成する正規化処理を追加する（カラムあり: `rel-{from.table}.{from.columns.join('+')}-{to.table}.{to.columns.join('+')}` 形式、カラムなし: `rel-{from.table}-{to.table}-{type}` 形式）
- [x] 2.4 `id` が欠落している `lineage` エントリに対して決定論的 id を自動生成する正規化処理を追加する（`lin-{from}-{to}` 形式）
- [x] 2.5 `sampleData` のヘッダー行検出ロジックを追加する（最初の行が全文字列かつ column id リストと完全一致する場合、除去して警告を出力）
- [x] 2.6 root-level `version` フィールドを `schema.version` として保持するよう正規化処理に追加する

## 3. Cytoscape 要素生成の更新（cytoscapeElements.ts）

- [x] 3.1 lineage エッジの ID 生成をパーサー正規化済みの `edge.id` を直接使用する形に変更する（`lin-${edge.from}-${edge.to}-${i}` → `edge.id`）
- [x] 3.2 ER エッジの ID 生成をパーサー正規化済みの `rel.id` を直接使用する形に変更する（`er-${i}` → `rel.id`）
- [x] 3.3 `fromColumn` / `toColumn` を `string[] | null` 型で渡すよう変更する（`rel.from.column` が `string[]` に正規化されるため）

## 4. グラフユーティリティの更新（graph.ts）

`graph.ts` は cytoscapeElements.ts とは独立してエッジ ID を生成しており、PathFinder（最短経路探索）・近傍ノード強調などで使用されている。cytoscapeElements.ts と ID が一致しないとハイライトが壊れる。

- [x] 4.1 `buildFilteredAdj` 内の ER エッジ ID 生成を `rel.id` ベースに変更する（`er-${index}` → `rel.id`）
- [x] 4.2 `buildFilteredAdj` 内の lineage エッジ ID 生成を `edge.id` ベースに変更する（`lin-${edge.from}-${edge.to}-${index}` → `edge.id`）
- [x] 4.3 `getAllReachable` のダウンストリーム BFS 内の lineage ID 生成を `edge.id` ベースに変更する（`lin-${edge.from}-${edge.to}-${index}` → `edge.id`）
- [x] 4.4 `getAllReachable` のアップストリーム BFS 内の lineage ID 生成を `edge.id` ベースに変更する（`lin-${edge.from}-${edge.to}-${index}` → `edge.id`）
- [x] 4.5 `getAllReachable` の ER BFS 内の ID 生成を `rel.id` ベースに変更する（`er-${index}` → `rel.id`）

## 5. エッジ削除ロジックの更新（App.tsx）

Delete/Backspace キー押下時のエッジ削除が、現在は `lin-...-${lastIndex}` のサフィックスからインデックスを逆算して lineage エントリを特定している（`App.tsx:248-255`）。エッジ ID が安定した値（`edge.id` / `rel.id`）になるため、直接照合に切り替える。

- [x] 5.1 lineage エッジ削除のロジックを `selectedEdgeId` で `lineage` エントリの `id` を直接照合する形に変更する（`lastIndexOf('-')` によるインデックス解析を廃止）
- [x] 5.2 ER エッジ削除のロジックを `selectedEdgeId` で `relationships` エントリの `id` を直接照合する形に変更する（`er-${i}` パターンの `find` を廃止）

## 6. UI コンポーネントの更新

`relationship.from.column` / `to.column` が `string[]` になることで、文字列として扱っていた3箇所が壊れる。

- [x] 6.1 `useStore.ts` の `updateColumnId` 内リレーション追従ロジックを `string[]` 対応に変更する（`r.from.column === oldId` → `r.from.column?.includes(oldId)` に変更し、更新時は配列内の該当要素を `map` で置換する）
- [x] 6.2 `DetailPanel.tsx` の `relationship.from.column` / `to.column` 表示を `string[]` に対応させる（`join(', ')` を使用し、空配列または未定義の場合は `'(Table level)'` を表示する）（対象行: 575, 639, 648）
- [x] 6.3 `CytoscapeCanvas.tsx` の `fromColumn?: string` / `toColumn?: string` 型定義を `string[] | null` に変更する（対象行: 673-674）

## 7. テストの更新

### 7-A. 既存ユニットテストの修正（cytoscapeElements.test.ts）

`column` が `string[]` になること・エッジ ID が `edge.id`/`rel.id` ベースになることで、テスト fixture とアサーションの修正が必要。

- [x] 7.1 ER エッジテストの relationship fixture を `string[]` 形式に更新する（`column: 'id'` → `column: ['id']`、`column: 'dim_id'` → `column: ['dim_id']`）
- [x] 7.2 ER エッジテストのアサーションを `string[]` 形式に修正する（`toBe('id')` → `toEqual(['id'])`）
- [x] 7.3 lineage テスト의 fixture に `id` フィールドを追加する（`yamlToElements` が `edge.id` を直接使用するため、id がない場合 `undefined` になる）
- [x] 7.4 ER テストの fixture に `id` フィールドを追加し、エッジ ID が `rel.id` になることを確認するアサーションを追加する
- [x] 7.5 複合カラム（`column: ['order_id', 'line_no']`）を持つ relationship が正しく `fromColumn: ['order_id', 'line_no']` を返すテストケースを追加する

### 7-B. パーサーユニットテストの新規作成（parser.test.ts）

`parser.ts` に追加する正規化ロジックに対するユニットテストが存在しないため、新規作成する。

- [x] 7.6 `relationship.from.column` / `to.column` が文字列の場合に `string[]` へ正規化されることをテストする
- [x] 7.7 `relationship.from.column` / `to.column` が配列の場合はそのまま保持されることをテストする
- [x] 7.8 `id` なし relationship（カラムあり）に決定論的 id が自動生成されることをテストする（`rel-{from}.{cols}-{to}.{cols}` 形式）
- [x] 7.9 `id` なし relationship（カラムなし）に決定論的 id が自動生成されることをテストする（`rel-{from}-{to}-{type}` 形式）
- [x] 7.10 `id` なし lineage に決定論的 id が自動生成されることをテストする（`lin-{from}-{to}` 形式）
- [x] 7.11 `Relationship.type: 'lineage'` のエントリが除外されることをテストする
- [x] 7.12 `sampleData` の最初の行が column id リストと完全一致する場合に除去されることをテストする
- [x] 7.13 `version` フィールドが `schema.version` として保持されることをテストする

## 8. CLI の更新（lineage.js）

- [x] 8.1 `lineage add` の dedup ロジックを `id` ベースに統一する（`--id` 省略時はコマンドが `lin-{from}-{to}` 形式で自動生成して YAML に書き込む）

## 9. CLI の更新（relationship.js）

- [x] 9.1 `relationship add` の dedup ロジックを `id` ベースに統一する（`--id` 省略時はコマンドがパーサーと同じルールで自動生成して YAML に書き込む：カラムあり `rel-{from}.{cols}-{to}.{cols}`、カラムなし `rel-{from}-{to}-{type}`）
- [x] 9.2 `relationship add` コマンドに `--id <id>` オプション（任意）を追加する
- [x] 9.3 `relationship remove` に `--id <id>` オプション（任意）を追加する

## 10. templates/default-model.yaml の修正

- [x] 10.1 `templates/default-model.yaml` のリレーション例に `id` を追加し、`column` を `['...']` に変更する

## 11. サンプルファイルの修正（samples/）

- [x] 11.1 `samples/1-retail-analytics.yaml` の `sampleData` ヘッダー行（`[customer_hk, customer_bk, ...]` の行）を除去する
- [x] 11.2 `samples/2-conformed-dims.yaml` の `sampleData` ヘッダー行を除去する

## 12. ビルドと動作確認

- [x] 12.1 `npm run build-ui` を実行してビルドが通ることを確認する
- [x] 12.2 `npm run test:e2e` を実行して既存テストが通ることを確認する
- [x] 12.3 UI に視覚的変更がある場合は `npm run test:update` でスナップショットを更新する
