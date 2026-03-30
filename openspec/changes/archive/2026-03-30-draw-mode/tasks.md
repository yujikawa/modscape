## 1. Zustand ストアの拡張

- [x] 1.1 `useStore.ts` に `isDrawMode: boolean`、`setIsDrawMode` を追加する

## 2. DrawOverlay コンポーネントの作成

- [x] 2.1 `visualizer/src/components/DrawOverlay.tsx` を新規作成する
- [x] 2.2 `<canvas>` 要素を `position: absolute; inset: 0` で配置し、`devicePixelRatio` を考慮したサイズ設定を実装する
- [x] 2.3 `isDrawMode` に応じて `pointer-events: all / none` を切り替える
- [x] 2.4 ペンツール：`mousedown` → `mousemove` → `mouseup` でストロークを描画する（`quadraticCurveTo` でなめらか化）
- [x] 2.5 消しゴムツール：`destination-out` composite を使った消去を実装する
- [x] 2.6 ストローク座標を配列で保持し、`ResizeObserver` によるリサイズ時に再描画する

## 3. DrawToolbar コンポーネントの作成

- [x] 3.1 `visualizer/src/components/DrawToolbar.tsx` を新規作成する
- [x] 3.2 `isDrawMode` が `false` のときは `null` を返す
- [x] 3.3 ペン / 消しゴムのトグルボタンを実装する
- [x] 3.4 `<input type="color">` によるカラーピッカーを実装する
- [x] 3.5 `<input type="number">` による太さ入力（px）を実装する
- [x] 3.6 全消去ボタンを実装する（DrawOverlay の `clearRect` を呼び出す）
- [x] 3.7 閉じるボタンで `setIsDrawMode(false)` を呼び出す

## 4. ActivityBar へのボタン追加

- [x] 4.1 `ActivityBar.tsx` にペイントボタンを追加する（既存の add ボタン群の下部）
- [x] 4.2 `isDrawMode` がアクティブなときのハイライトスタイルを設定する
- [x] 4.3 Tooltip に "Draw Mode" を設定する

## 5. App.tsx への配置

- [x] 5.1 `App.tsx` の `Flow` コンポーネント内に `DrawOverlay` と `DrawToolbar` を配置する
- [x] 5.2 DrawToolbar を ActivityBar の右横（`position: absolute; left: 56px`）に配置する

## 6. ビルド・動作確認

- [x] 6.1 `npm run build-ui` が通ることを確認する
- [ ] 6.2 ペン描画・消しゴム・色変更・太さ変更・全消去・モードOFF後の描画残存を手動確認する
- [ ] 6.3 `npm run test:e2e -- --update-snapshots` でスナップショットを更新する
