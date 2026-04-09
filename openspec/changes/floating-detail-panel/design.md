## Context

現在 `DetailPanel` は `App.tsx` の `Flow` コンポーネント内で `flex-col` レイアウトの末尾に配置されている。

```
Flow (flex-col)
├── <div class="flex-1 relative">  ← キャンバス領域
│       CytoscapeCanvas
│       TerminalBar (position:absolute)
│       SelectionToolbar (position:absolute)
└── <DetailPanel />                 ← flex item → 開くとキャンバスが縮む
```

一方 `TerminalBar` はすでに `position:absolute` でキャンバス内にオーバーレイしており、ドラッグ・リサイズ・開閉の完全な実装パターンが存在する。`DetailPanel` もこのパターンに統一することで、実装の一貫性を保ちつつキャンバス領域の非侵食化を実現できる。

`SelectionToolbar` は右上固定の `position:absolute` コンポーネントであり、選択中のエンティティ名・種別を表示する。これが DetailPanel の「最小化ヘッダー」役として機能する。

## Goals / Non-Goals

**Goals:**
- DetailPanel をキャンバスレイアウトから切り離し、`position:absolute` オーバーレイにする
- SelectionToolbar に「詳細を開く」ボタン（Inspect アイコン）を追加し、DetailPanel の開閉トリガーとする
- DetailPanel をドラッグ移動・コーナーリサイズ可能にする（TerminalBar と同等）
- 選択解除（Esc / × ）で DetailPanel も連動クローズする
- ノードクリック時は SelectionToolbar だけ表示し、DetailPanel は開かない（デフォルト非表示）

**Non-Goals:**
- 複数エンティティの DetailPanel を同時に開く機能
- DetailPanel の位置・サイズを localStorage に永続化する（初回はデフォルト位置）
- SelectionToolbar のレイアウトを大幅に変更すること

## Decisions

### 1. TerminalBar と同じフローティングパターンを採用

**決定**: `pos` / `size` state + `mousedown` ドラッグロジックを DetailPanel にそのまま適用する。

**理由**: TerminalBar の実装は同プロジェクト内で動作実績がある。新たなライブラリ（`react-draggable` 等）を導入せず、依存を増やさない。

**代替案**: CSS `resize` プロパティ + `position:absolute` のみで実装 → リサイズ方向の自由度が低く却下。

---

### 2. DetailPanel の開閉状態を Zustand ストアで管理

**決定**: `isDetailPanelOpen: boolean` を useStore に追加し、SelectionToolbar と DetailPanel の両方から参照する。

**理由**: SelectionToolbar（開くボタン）と DetailPanel（閉じるボタン、選択解除連動）が別コンポーネントのため、prop drilling ではなく共有ストアが適切。

**代替案**: App レベルの state を prop で渡す → コンポーネント階層が深く煩雑になるため却下。

---

### 3. SelectionToolbar のボタンで DetailPanel をトグル

**決定**: SelectionToolbar の情報エリア右端に `PanelBottomOpen`（または `Inspect`）アイコンボタンを追加する。クリックで `isDetailPanelOpen` をトグル。

**理由**: ユーザーが「SelectionToolbar を押したら DetailPanel が開く」というメンタルモデルを明示的に実現する。SelectionToolbar 全体をクリック可能にする案もあったが、情報エリアへの誤クリックを避けるため個別ボタンとする。

---

### 4. App.tsx での DetailPanel 配置変更

**決定**: `<DetailPanel />` を `Flow` の flex 末尾から、キャンバスラッパー（`<div class="flex-1 relative overflow-hidden">`）の内側に移動する。

**理由**: `position:absolute` は最近の `position:relative` 祖先を基準にする。キャンバスラッパーが `relative` を持つため、ここに配置することでキャンバス内に収まる。

---

### 5. 既存の isDetailPanelMinimized / isDetailPanelSuppressed は削除

**決定**: 下部固定時代の最小化フラグは不要になるため削除する。代わりに `isDetailPanelOpen` 一本に統合。

**理由**: フローティング化後は「開く/閉じる」の二状態のみで十分。最小化（タイトルバーだけ残す）の概念は SelectionToolbar が担う。

## Risks / Trade-offs

- **DetailPanel がキャンバスノードの上に重なる** → ドラッグで移動できるため問題なし。初期位置を右下に設定して重なりを最小化する。
- **DetailPanel を開いたまま別ノードを選択した場合** → 内容を新しい選択に更新しつつ、位置・サイズは維持する（TerminalBar と同様の挙動）。
- **DetailPanel を開いたまま選択解除した場合** → 連動クローズが適切。ユーザーが「詳細を見ていない」選択解除操作後に空のパネルが残ると混乱を招く。
- **キャンバスが小さいウィンドウサイズでのオーバーフロー** → TerminalBar と同様に `clamp` でキャンバス内に収める処理を適用する。
