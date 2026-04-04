## 1. storeの更新

- [x] 1.1 `useStore.ts` の `isCommandPaletteOpen` / `setIsCommandPaletteOpen` を `isTerminalOpen` / `setIsTerminalOpen` にリネームする
- [x] 1.2 `executePipeline()` を `executeCommand(input: string): { status: 'success' | 'error', message: string }` に置き換える（パイプ構文なし、1コマンド1実行）
- [x] 1.3 `executeCommand` に以下のコマンドを実装する: `t`, `d`, `c`, `s`, `er`, `ln`, `mv`, `del`, `find`, `fit`, `theme`
- [x] 1.4 `mv` のglobパターン（`*`）マッチングを実装する

## 2. TerminalBar コンポーネントの作成

- [x] 2.1 `visualizer/src/components/TerminalBar.tsx` を新規作成する
- [x] 2.2 画面下部固定レイアウト（`fixed bottom-0`）と入力欄を実装する
- [x] 2.3 `Ctrl+K` でフォーカス、`Escape` で閉じる動作を実装する
- [x] 2.4 コマンド履歴（`↑`/`↓`）を実装する（セッション内のみ保持、最大50件）
- [x] 2.5 実行履歴表示エリアを実装する（✓/✗ + メッセージを最新3件表示）

## 3. サジェストの実装

- [x] 3.1 入力トークン位置に応じたサジェスト候補を実装する（コマンド名 → テーブルID → カラムID or ドメインID）
- [x] 3.2 サジェストリストを上方向ポップアップで表示する（`absolute bottom-full`）
- [x] 3.3 `Tab` または `↑`/`↓` + `Enter` でサジェストを確定できるようにする

## 4. キャンバスハイライト連動

- [x] 4.1 入力中のトークンをパースして対象ノードIDを抽出し、`setHighlightedNodeIds()` を呼び出すようにする（`er`/`ln`/`mv`/`del`/`find` コマンド対応）

## 5. CommandPaletteの削除

- [x] 5.1 `visualizer/src/components/CommandPalette.tsx` を削除する
- [x] 5.2 `App.tsx` から `CommandPalette` のimportとマウントを削除し、`TerminalBar` を追加する
- [x] 5.3 `App.tsx` のキーボードショートカットから `/` キー（palette open）を削除し、`Ctrl+K` を `TerminalBar` のトグルに変更する

## 6. CytoscapeCanvas のキー削除

- [x] 6.1 `CytoscapeCanvas.tsx` から `r`/`l` キーハンドラ（connect mode トグル）を削除する
- [x] 6.2 `connectMode` に関連するstore状態・ハンドラが TerminalBar 経由で不要になった場合は合わせて削除する

## 7. テストとスナップショット

- [x] 7.1 `npm run build-ui` が通ることを確認する
- [x] 7.2 `npm run test:update` でスナップショットを更新する
- [x] 7.3 既存のCommandPalette関連のE2Eテストを TerminalBar の操作に合わせて更新する
