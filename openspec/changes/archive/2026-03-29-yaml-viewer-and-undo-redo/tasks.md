## 1. Zustand Store: Undo/Redoヒストリースタックの追加

- [x] 1.1 `useStore.ts` に `schemaHistory: Schema[]`、`historyIndex: number` をstateに追加する
- [x] 1.2 `pushHistory()` ヘルパー関数を実装する（現在の `schema` をスタックに積み、上限50を超えたら先頭を削除。`historyIndex` 以降のredoスタックもクリア）
- [x] 1.3 `undo()` アクションを実装する（`historyIndex--` し、対応するスナップショットを `schema` に復元、`syncToYamlInput()` を呼ぶ。`lastUpdateSource` を `'undo'` に設定）
- [x] 1.4 `redo()` アクションを実装する（`historyIndex++` し、対応するスナップショットを `schema` に復元、`syncToYamlInput()` を呼ぶ）
- [x] 1.5 `AppState` インターフェースに `schemaHistory`、`historyIndex`、`undo`、`redo` を追加する

## 2. Zustand Store: mutation actionへの pushHistory 追加

- [x] 2.1 `addTable` の先頭に `pushHistory()` を追加する
- [x] 2.2 `addDomain` の先頭に `pushHistory()` を追加する
- [x] 2.3 `addConsumer` の先頭に `pushHistory()` を追加する
- [x] 2.4 `removeNode` の先頭に `pushHistory()` を追加する
- [x] 2.5 `bulkRemoveTables` の先頭に `pushHistory()` を追加する
- [x] 2.6 `addRelationship` の先頭に `pushHistory()` を追加する
- [x] 2.7 `addLineage` の先頭に `pushHistory()` を追加する
- [x] 2.8 `removeEdge` の先頭に `pushHistory()` を追加する
- [x] 2.9 `updateNodePosition` の先頭に `pushHistory()` を追加する
- [x] 2.10 `updateNodesPosition` の先頭に `pushHistory()` を追加する
- [x] 2.11 `addAnnotation` の先頭に `pushHistory()` を追加する
- [x] 2.12 `removeAnnotation` の先頭に `pushHistory()` を追加する
- [x] 2.13 `assignTableToDomain` の先頭に `pushHistory()` を追加する
- [x] 2.14 `bulkAssignTablesToDomain` の先頭に `pushHistory()` を追加する
- [x] 2.15 `applyLayout` の先頭に `pushHistory()` を追加する
- [x] 2.16 `distributeSelectedTables` の先頭に `pushHistory()` を追加する
- [x] 2.17 `setCurrentModel` でファイル切り替え時にヒストリーをリセット（`schemaHistory: []`、`historyIndex: -1`）する

## 3. グローバルキーボードショートカットの追加

- [x] 3.1 `App.tsx` に `useEffect` でグローバル `keydown` リスナーを追加する
- [x] 3.2 `document.activeElement` が `INPUT`、`TEXTAREA`、`[contenteditable]` の場合はスキップするロジックを実装する
- [x] 3.3 `Ctrl+Z` / `Cmd+Z` で `store.undo()` を呼ぶ処理を実装する
- [x] 3.4 `Ctrl+Shift+Z` / `Cmd+Shift+Z` で `store.redo()` を呼ぶ処理を実装する

## 4. YAMLエディター → Viewer化

- [x] 4.1 `EditorTab.tsx` の `CodeMirror` コンポーネントに `readOnly={true}` を追加する
- [x] 4.2 `onChange` ハンドラー（`handleChange`）とデバウンスタイマー（`timerRef`）を削除する
- [x] 4.3 Undo/Redoボタン（CodeMirrorテキスト履歴用）を削除する
- [x] 4.4 `handleUndo` / `handleRedo` 関数を削除する
- [x] 4.5 `lastUpdateSource !== 'user'` の分岐ロジックを削除し、外部更新の同期ロジックを整理する
- [x] 4.6 `Sidebar.tsx` のタブラベルを "Editor" → "YAML" に変更する

## 5. ビルドとスナップショット更新

- [x] 5.1 `npm run build-ui` を実行してビルドが成功することを確認する
- [x] 5.2 `npm run test:update` を実行してE2Eスナップショットを更新する
