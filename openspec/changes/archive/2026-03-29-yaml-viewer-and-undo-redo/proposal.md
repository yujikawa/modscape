## Why

YAMLの直接編集はVS CodeやAIエージェントが担う運用スタイルが定着しており、ビジュアライザー内のYAMLエディターは編集機能を持つ必要がなくなった。一方でグラフ上のビジュアル操作（ノード削除・移動・リレーション追加など）には誤操作を戻す手段がなく、undo/redo機能が求められている。

## What Changes

- **YAMLエディター → Viewer化**: サイドバーの `EditorTab` を読み取り専用のYAML Viewerに変更する。CodeMirrorをread-onlyモードにし、編集関連のUI（onChange、デバウンスロジック、CodeMirrorのUndo/Redoボタン）を削除する。
- **アプリレベルのUndo/Redo実装**: Zustand storeにスキーマ履歴スタック（`schemaHistory`・`historyIndex`）を追加し、グラフの構造変更操作（追加・削除・移動など）の前にスナップショットを保存する。
- **グローバルキーボードショートカット**: `Ctrl+Z` でundo、`Ctrl+Shift+Z` でredoをアプリ全体で有効にする。テキスト入力フォーカス中はブラウザネイティブのundo/redoに委ねるため、アプリレベルのショートカットはスキップする。
- **履歴スコープ**: ファイル単位。ファイル切り替え時に履歴をリセットする。上限50ステップ。

**対象操作（undo/redo対象）:**
- テーブル / ドメイン / Consumer の追加・削除
- リレーション / Lineage の追加・削除
- ノードのドラッグ移動（`dragfree` / domain drag end）
- レイアウト適用・分布整列
- ドメインへのテーブル割り当て
- アノテーションの追加・削除・移動

**対象外操作（テキスト編集 → ブラウザに委ねる）:**
- テーブル名・説明文・ドメイン名などの入力フォームでのテキスト編集

## Capabilities

### New Capabilities

- `yaml-viewer`: YAMLエディターを読み取り専用Viewerに変更する機能。編集UIを取り除き、現在のスキーマ状態をリアルタイムに表示する。
- `graph-undo-redo`: グラフ構造変更操作のundo/redo機能。Zustand storeにヒストリースタックを持ち、Ctrl+Z / Ctrl+Shift+Z でグローバルに操作できる。

### Modified Capabilities

（なし）

## Impact

- `visualizer/src/components/Sidebar/EditorTab.tsx` — read-only化、編集ロジック削除
- `visualizer/src/store/useStore.ts` — `schemaHistory`・`historyIndex`・`undo()`・`redo()` の追加、各mutation actionへの `pushHistory()` 呼び出し追加
- `visualizer/src/App.tsx` — グローバルキーボードショートカット（Ctrl+Z / Ctrl+Shift+Z）の追加
- `lastUpdateSource: 'undo'` — 既存の型定義を実際に活用
