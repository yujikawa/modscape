## Phase 1: View ツールバーをキャンバス上に移動

- [x] 1.1 `CanvasViewToolbar.tsx` を新規作成する（Lineage/ER/Annotations/CompactMode のトグルボタン + AutoLayout ボタン横並び、backdrop-blur の半透明背景）
- [x] 1.2 `App.tsx` のキャンバス領域内に `CanvasViewToolbar` を `absolute top-4 left-4` で配置する
- [x] 1.3 `ActivityBar.tsx` から View セクション（Lineage/ER/Annotations/CompactMode ボタン）を削除する
- [x] 1.4 `ActivityBar.tsx` から Auto Layout ボタンを削除する
- [x] 1.5 `npm run build-ui` でビルドが通ることを確認する
- [x] 1.6 `npm run test:update` でスナップショットを更新する

## Phase 2: 左パネルに Stats タブを追加

- [x] 2.1 `visualizer/src/components/Sidebar/StatsTab.tsx` を新規作成する（`ModelStatsTab.tsx` の中身を移植）
- [x] 2.2 `useStore.ts` の `activeTab` 型を `'editor' | 'entities' | 'connect'` → `'yaml' | 'stats'` に変更する
- [x] 2.3 `Sidebar.tsx` のタブ構成を「YAML / Stats」の2タブに変更し、`StatsTab` を組み込む
- [x] 2.4 `Sidebar.tsx` から `QuickConnectTab` のインポートと参照を削除する（この時点ではファイルは残す）
- [x] 2.5 `App.tsx` の `activeTab === 'editor'` 参照を `'yaml'` に更新する
- [x] 2.6 `RightPanel.tsx` から `ModelStatsTab` のインポート・タブボタン・コンテンツ表示を削除する
- [x] 2.7 `useStore.ts` の `activeRightPanelTab` 型から `'stats'` を除外する
- [x] 2.8 `npm run build-ui` でビルドが通ることを確認する
- [x] 2.9 `npm run test:update` でスナップショットを更新する

## Phase 3: 右パネルの Search + Tables 統合

- [x] 3.1 `visualizer/src/components/RightPanel/SearchTab.tsx` を新規作成する（`query` state で `''` → ツリー表示、入力あり → フルテキスト結果）
- [x] 3.2 `SearchTab` の未入力時はドメイン階層ツリーを表示する（`TablesTab` のロジックを移植）
- [x] 3.3 `SearchTab` の入力時はフルテキスト検索結果を表示する（`InformationSearchTab` のロジックを移植）
- [x] 3.4 `RightPanel.tsx` のタブ構成を「Search / Path / Notes」の3タブに変更し `SearchTab` を組み込む
- [x] 3.5 `RightPanel.tsx` から `TablesTab`・`InformationSearchTab` のインポートと参照を削除する
- [x] 3.6 `useStore.ts` の `activeRightPanelTab` 型から `'tables'`・`'information-search'` を除去し `'search'` を追加する
- [x] 3.7 右パネルの `/` ショートカット（`setActiveRightPanelTab('tables')`）を `'search'` に更新する
- [x] 3.8 `TablesTab.tsx`・`InformationSearchTab.tsx` を削除する
- [x] 3.9 `npm run build-ui` でビルドが通ることを確認する
- [x] 3.10 `npm run test:update` でスナップショットを更新する

## Phase 4: Connect を Command Palette に統合

- [x] 4.1 `CommandPalette.tsx` にモード状態（`'pipeline' | 'connect-er' | 'connect-flow'`）を追加する
- [x] 4.2 初期表示にモード選択UI（Pipeline / Connect ER / Connect Flow）を追加する
- [x] 4.3 Connect ER モードの Source/Target 入力フォームを実装する（`QuickConnectTab` のERモードロジックを移植）
- [x] 4.4 Connect Flow モードの Source/Target 入力フォームを実装する（`QuickConnectTab` の Lineage モードロジックを移植）
- [x] 4.5 候補ドロップダウンをテーブル/カラムのグループ表示に改善する（テーブル行: 太字アイコン付き、カラム行: インデント細字、Bulk候補: 専用行）
- [x] 4.6 `App.tsx` の `L` キーショートカット（`setActiveTab('connect')`）を削除する
- [x] 4.7 `ActivityBar.tsx` の Shortcut Guide から「Quick Connect (L)」を削除する
- [x] 4.8 `QuickConnectTab.tsx` を削除する
- [x] 4.9 `npm run build-ui` でビルドが通ることを確認する
- [x] 4.10 `npm run test:update` でスナップショットを更新する
