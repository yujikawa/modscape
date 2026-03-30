## Context

Modscape のキャンバスは Cytoscape.js（HTML5 Canvas 2D）で描画されており、その上に DOM ノード（TableCard など）が重なる構造になっている。現状、キャンバス上への自由な描き込み手段はない。

お絵描き機能を実装するには、Cytoscape のイベントハンドリングと競合しないよう、独立した描画レイヤーが必要となる。

## Goals / Non-Goals

**Goals:**
- キャンバス上にフリーハンドで描き込める描画オーバーレイを追加する
- お絵描きモード中のみ描画入力を受け付け、通常モードでは Cytoscape の操作を妨げない
- モード終了後も描画内容をキャンバス上に表示し続ける
- ペン・消しゴム・カラーピッカー・太さ入力・全消去を提供するツールバーを追加する

**Non-Goals:**
- 描画内容の永続化（localStorage・YAML 保存）
- PNG エクスポート（右パネルの既存機能で対応）
- レーザーポインターモード
- 図形ツール・テキストツール・矢印などの高度なツール
- 複数人同時編集

## Decisions

### 1. オーバーレイに独立した `<canvas>` 要素を使用する

**決定**: CytoscapeCanvas と同じ親要素に `<canvas>` を `position: absolute; inset: 0` で重ねる。

**理由**: Cytoscape の内部 canvas に直接描くと、Cytoscape のレンダリングサイクルで上書きされてしまう。独立した canvas を重ねることで、両者のライフサイクルを完全に分離できる。

**代替案**: SVG オーバーレイ → ストローク数が増えると DOM ノードが増大するため不採用。

---

### 2. `pointer-events` の切り替えでモードを制御する

**決定**: お絵描きモード中は `pointer-events: all`、通常モードは `pointer-events: none` に切り替える。

**理由**: 追加の click ハンドラーや複雑な条件分岐なしに、オーバーレイの有効・無効を CSS 一行で制御できる。Cytoscape 側の実装変更が不要。

---

### 3. ストロークの滑らか化に `quadraticCurveTo()` を使用する

**決定**: `mousemove` イベントの座標を直線でつなぐのではなく、前の点と現在の点の中点を制御点とした二次ベジェ曲線で描画する。

**理由**: 追加ライブラリなしで自然なフリーハンド線が得られる最小実装。

---

### 4. ツールバーは独立コンポーネント（`DrawToolbar`）として実装する

**決定**: `DrawToolbar.tsx` を新規作成し、`App.tsx` の `Flow` コンポーネント内に配置する。`position: absolute` でキャンバスに重ねて表示する。

**理由**: ActivityBar から独立させることで、ツールバーの表示・非表示ロジックとキャンバスのオーバーレイを同じ `Flow` コンポーネントのスコープに収められる。

---

### 5. 状態管理は Zustand ストアに `isDrawMode` を追加する

**決定**: `useStore.ts` に `isDrawMode: boolean` と `setIsDrawMode` を追加する。

**理由**: 既存の `connectMode` と同様のパターンで統一できる。DrawOverlay・DrawToolbar・ActivityBar の3コンポーネントが同じ状態を参照するため、グローバルストアが適切。

## Risks / Trade-offs

- **キャンバスリサイズ時に描画が消える** → `ResizeObserver` でウィンドウサイズ変化を検知し、canvas のサイズを再設定する際に既存ストロークを再描画する。ストローク座標を配列として保持しておき、リサイズ後に再描画する。
- **高解像度ディスプレイでの描画ズレ** → `devicePixelRatio` を考慮して canvas の内部解像度を設定する（`width = offsetWidth * dpr`）。
- **描画中に Cytoscape の scroll/zoom が発火する可能性** → `pointer-events: all` のオーバーレイが手前にあるため、描画中は Cytoscape へのイベントは届かない。問題なし。
