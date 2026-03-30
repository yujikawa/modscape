## Why

v2.4.0 でYAMLエディタが読み取り専用になったため、DetailPanelでUIを操作してもどのフィールドがどう変わったのかが一目でわからない。YAMLビューアに ON/OFF 切り替え可能な diff 表示を追加することで、編集中の変更内容を確認できるようにする。

## What Changes

- YAMLサイドバータブに "Diff" トグルボタンを追加する
- diff OFF 時：現状と同じ YAML ビューアをそのまま表示（処理コストなし）
- diff ON 時：ディスクから最後に読み込んだ YAML を baseline として、現在の YAML との unified diff を表示（追加行は緑、削除行は赤）
- baseline はモデルのロード・外部ファイル変更受信（WebSocket）時に更新する
- diff 計算は外部ライブラリを使わず自前実装（LCS ベース）

## Capabilities

### New Capabilities
- `yaml-diff-viewer`: YAMLビューアに unified diff 表示機能を追加する

### Modified Capabilities
- `yaml-viewer`: diff トグルボタンの追加により要件が変わる

## Impact

- `visualizer/src/store/useStore.ts` — `baselineYaml` state の追加、`refreshModelData` / `loadModel` での snapshot 保存
- `visualizer/src/components/Sidebar/` — diff トグルボタンと diff レンダリングコンポーネントの追加
- 外部依存の追加なし
