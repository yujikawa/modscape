## Why

左右パネルとActivityBarに機能が散在しており、「見る操作」と「行う操作」が混在した結果、各UIの役割が曖昧になっている。特にConnectタブ（左パネル）・Tables/InformationSearchの重複（右パネル）・Viewトグル群（ActivityBar）が顕著な課題であり、ナビゲーション全体を「閲覧」と「操作」の2軸で整理しなおすことで、UXの一貫性と発見性を高める。

## What Changes

### Phase 1: View ツールバーをキャンバス上に移動
- ActivityBar の「View」セクション（Lineage/ER/Annotations/Compact Mode の4ボタン）を削除
- キャンバス左上に横並びのフローティングツールバーとして独立配置
- ActivityBar が Add 操作に特化した縦ツールバーになる

### Phase 2: 左パネルに Stats タブを追加
- 左パネルのタブを「YAML」「Stats」の2タブ構成に変更
- 右パネルから Model Stats タブを削除
- 左パネルの `activeTab` 型を `'editor' | 'entities' | 'connect'` → `'yaml' | 'stats'` に変更

### Phase 3: 右パネルの Search + Tables を統合
- `TablesTab` と `InformationSearchTab` を1つの `SearchTab` に統合
- 検索ワード未入力時: ドメイン階層ツリー表示（現 TablesTab と同等）
- 検索ワード入力時: フルテキスト検索結果表示（現 InformationSearchTab と同等）
- 右パネルのタブ構成: 5タブ（Search/Tables/Path/Notes/Stats）→ 3タブ（Search/Path/Notes）に削減

### Phase 4: Connect を Command Palette に統合
- 左パネルから Connect タブを削除
- `CommandPalette` に「Connect モード」を追加（ER / Lineage）
- 候補表示をテーブル/カラムのグループ表示に改善（テーブル行 + インデントされたカラム行）
- `L` キーショートカットを Command Palette 呼び出し（`Ctrl+K`）に統合または廃止

## Capabilities

### New Capabilities
- `canvas-view-toolbar`: キャンバス左上に配置するViewトグルのフローティングツールバー
- `unified-search-tab`: ツリー表示とフルテキスト検索を1タブに統合した右パネルのSearchタブ
- `command-palette-connect`: Command PaletteにConnectモード（ER/Lineage接続・グループ表示候補）を統合

### Modified Capabilities
- `yaml-viewer`: 左パネルのタブ構成変更（Statsタブ追加、Connectタブ削除）

## Impact

- `visualizer/src/components/Sidebar/ActivityBar.tsx` — View セクション削除、Add セクションのみに整理
- `visualizer/src/components/Sidebar/Sidebar.tsx` — タブ構成変更（yaml / stats）、QuickConnectTab を削除
- `visualizer/src/components/Sidebar/QuickConnectTab.tsx` — 削除
- `visualizer/src/components/RightPanel/RightPanel.tsx` — タブ構成変更（3タブ）、TablesTab/InformationSearchTab/ModelStatsTab を削除
- `visualizer/src/components/RightPanel/TablesTab.tsx` — SearchTab に統合・削除
- `visualizer/src/components/RightPanel/InformationSearchTab.tsx` — SearchTab に統合・削除
- `visualizer/src/components/RightPanel/ModelStatsTab.tsx` — 左パネルの StatsTab に移動
- `visualizer/src/components/RightPanel/SearchTab.tsx` — 新規作成
- `visualizer/src/components/Sidebar/StatsTab.tsx` — 新規作成（ModelStatsTab を移植）
- `visualizer/src/components/CanvasViewToolbar.tsx` — 新規作成
- `visualizer/src/components/CommandPalette.tsx` — Connectモード追加
- `visualizer/src/store/useStore.ts` — `activeTab` 型変更、`activeRightPanelTab` 型変更
- `visualizer/src/App.tsx` — CanvasViewToolbar の配置、`L` キーショートカットの変更
