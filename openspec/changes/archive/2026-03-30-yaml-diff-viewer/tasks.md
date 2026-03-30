## 1. store に baselineYaml を追加

- [x] 1.1 `useStore.ts` の `AppState` に `baselineYaml: string` を追加する
- [x] 1.2 `loadModel` 完了時に `baselineYaml` をセットする
- [x] 1.3 `refreshModelData` 完了時に `baselineYaml` をセットする

## 2. diff ユーティリティ関数の実装

- [x] 2.1 `visualizer/src/lib/diff.ts` を新規作成し、行単位の Myers diff（LCS ベース）を実装する（追加・削除・変更なしの3種類を返す）

## 3. YAML サイドバーに diff UI を追加

- [x] 3.1 YAMLタブのヘッダーに "Diff" トグルボタンを追加する（useState で ON/OFF 管理）
- [x] 3.2 diff ON 時、`baselineYaml` と `yamlInput` を比較して diff 結果を行ごとに表示するコンポーネントを実装する（追加行: 緑 + `+`、削除行: 赤 + `-`、変更なし行: 通常表示）
- [x] 3.3 diff ON かつ差分なしの場合に "No changes" メッセージを表示する

## 4. ビルド・スナップショット更新

- [x] 4.1 `npm run build-ui` を実行してビルドが成功することを確認する
- [ ] 4.2 `npm run test:update` を実行してスナップショットを更新する
