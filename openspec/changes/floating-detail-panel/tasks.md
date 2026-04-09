## 1. ストア変更

- [x] 1.1 `useStore.ts` に `isDetailPanelOpen: boolean` を追加し、初期値を `false` にする
- [x] 1.2 `useStore.ts` に `setIsDetailPanelOpen(open: boolean)` アクションを追加する
- [x] 1.3 `useStore.ts` から `isDetailPanelMinimized` / `setIsDetailPanelMinimized` / `isDetailPanelSuppressed` を削除する

## 2. DetailPanel のフローティング化

- [x] 2.1 `DetailPanel.tsx` の最外ラッパーを `position:absolute` に変更し、Flexレイアウトから切り離す
- [x] 2.2 `TerminalBar.tsx` を参考に `pos` / `size` state とデフォルト値（右下配置）を追加する
- [x] 2.3 ヘッダーのドラッグ移動ロジックを実装する（`mousedown` → `mousemove` → `mouseup`）
- [x] 2.4 コーナーのリサイズハンドルを追加し、リサイズロジックを実装する
- [x] 2.5 `isDetailPanelOpen` が `false` のとき `return null` で非表示にする
- [x] 2.6 DetailPanel 内の × ボタンで `setIsDetailPanelOpen(false)` を呼ぶよう変更する
- [x] 2.7 `isDetailPanelMinimized` / `isDetailPanelSuppressed` を参照している既存コードを削除する

## 3. App.tsx の配置変更

- [x] 3.1 `<DetailPanel />` を `Flow` の flex 末尾から、キャンバスラッパー（`flex-1 relative overflow-hidden`）の内側に移動する

## 4. SelectionToolbar への開閉ボタン追加

- [x] 4.1 `SelectionToolbar.tsx` で `isDetailPanelOpen` / `setIsDetailPanelOpen` を useStore から取得する
- [x] 4.2 シングル選択時（マルチ選択でない場合）の情報エリア右端に `PanelBottomOpen` / `PanelBottomClose` アイコンボタンを追加する
- [x] 4.3 ボタンクリックで `setIsDetailPanelOpen(!isDetailPanelOpen)` を呼ぶ

## 5. 選択解除連動クローズ

- [x] 5.1 `App.tsx` の `handlePaneClick`（キャンバス空白クリック）で `setIsDetailPanelOpen(false)` を追加する
- [x] 5.2 `App.tsx` のキーボードハンドラの Esc 処理で `setIsDetailPanelOpen(false)` を追加する
- [x] 5.3 `SelectionToolbar.tsx` の `handleClearSelection` で `setIsDetailPanelOpen(false)` を追加する

## 6. ビルドと動作確認

- [x] 6.1 `npm run build-ui` が成功することを確認する
- [ ] 6.2 ノードクリック → SelectionToolbar のみ表示、DetailPanel は非表示であることを手動確認する
- [ ] 6.3 「詳細を開く」ボタンで DetailPanel がオーバーレイ表示されキャンバスが縮まないことを確認する
- [ ] 6.4 DetailPanel のドラッグ移動・リサイズが機能することを確認する
- [ ] 6.5 Esc / × / キャンバス空白クリックで DetailPanel が閉じることを確認する
- [ ] 6.6 `npm run test:e2e -- --update-snapshots` でスナップショットを更新し、差分をコミットする
