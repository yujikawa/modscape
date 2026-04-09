## Why

DetailPanel が FlowコンポーネントのFlexレイアウト末尾に配置されているため、開くたびにキャンバス領域が縮小される。モデルを参照しながら詳細を確認するという基本操作でキャンバスが狭くなるのは視認性・操作性を著しく損なう。

## What Changes

- **DetailPanel をフローティングウィンドウ化**: `position: absolute` でキャンバス上にオーバーレイ表示し、Flexレイアウトへの影響をゼロにする
- **SelectionToolbar に「詳細を開く」ボタンを追加**: 右上の選択中インジケーターから明示的に DetailPanel を開けるようにする
- **DetailPanel のドラッグ移動・リサイズ対応**: TerminalBar と同じ実装パターンで自由に動かせるようにする
- **DetailPanel のデフォルトを非表示に変更**: ノードクリック時は SelectionToolbar だけ出て、DetailPanel は手動で開く
- **選択解除時に DetailPanel を連動して閉じる**: Esc / × での選択解除で DetailPanel も自動クローズ
- **現在の下部固定パネルの削除**: Flexレイアウト上のスペース消費をなくす

## Capabilities

### New Capabilities
- `floating-detail-panel`: DetailPanel をキャンバス上にフローティング表示し、ドラッグ移動・リサイズ・開閉ができる機能

### Modified Capabilities
（なし。SelectionToolbar へのボタン追加は実装の変更であり、spec レベルの要件変更には該当しない）

## Impact

- `visualizer/src/components/DetailPanel.tsx` — レイアウト方式を flex-shrink-0 から position:absolute へ変更、ドラッグ・リサイズロジック追加
- `visualizer/src/components/SelectionToolbar.tsx` — 「詳細を開く」ボタンの追加
- `visualizer/src/App.tsx` — DetailPanel の配置をキャンバス内部（relative コンテナ配下）へ移動
- `visualizer/src/store/useStore.ts` — DetailPanel の開閉状態を管理するフラグの追加
