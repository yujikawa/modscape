## Why

データモデルのレビューやプレゼンテーション時に、キャンバス上で直接フリーハンド描画できる機能がないため、口頭説明だけでは伝わりにくい場面がある。お絵描きモードを追加することで、テーブル間の関係や注目点を視覚的にその場で補足でき、チームコミュニケーションを向上させる。

## What Changes

- ActivityBar に「お絵描きモード」ボタンを追加する
- お絵描きモード ON 時に、ActivityBar 右横へ縦長フローティングツールバーが出現する
- ツールバーの機能：ペン / 消しゴム（トグル）、カラーピッカー、太さ数値入力（px）、全消去
- CytoscapeCanvas 上に Canvas 2D オーバーレイを重ねて描画を実現する
- お絵描きモード OFF 時はツールバーが消えるが、描画内容はキャンバス上に残る
- 通常モードでは Cytoscape の操作（テーブルのクリック・移動等）は従来通り動作する

## Capabilities

### New Capabilities

- `draw-mode`: フリーハンド描画オーバーレイ機能。ペン・消しゴム・色・太さを備えた描画ツールバーを提供し、キャンバス上への描き込みを可能にする。

### Modified Capabilities

（なし）

## Impact

- `visualizer/src/components/ActivityBar.tsx` — お絵描きモードボタンの追加
- `visualizer/src/components/DrawToolbar.tsx` — 新規コンポーネント（縦長フローティングツールバー）
- `visualizer/src/components/DrawOverlay.tsx` — 新規コンポーネント（Canvas 2D オーバーレイ）
- `visualizer/src/App.tsx` — DrawOverlay の配置
- `visualizer/src/store/useStore.ts` — `isDrawMode: boolean` の追加
- 追加ライブラリなし（Canvas 2D API のみ使用）
