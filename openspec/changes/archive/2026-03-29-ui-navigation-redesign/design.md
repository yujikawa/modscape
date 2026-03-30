## Context

現在のUIは左パネル（YAML/Connect）、右パネル（Search/Tables/Path/Notes/Stats）、ActivityBar（View/Add）の3領域に機能が分散している。特に以下の問題が顕在化している：

1. **ActivityBar の View セクション**: Lineage/ER/Annotations/Compact の4ボタンが縦並びで占有。これらはトグル操作であり、Add 操作と性質が異なる。
2. **右パネルの TablesTab と InformationSearchTab**: どちらも「テーブルを探す」UIだが、UI上の違いが伝わりにくい。
3. **左パネルの QuickConnectTab**: 「操作系」の機能が「閲覧系」パネルに同居している。
4. **右パネルの ModelStatsTab**: 検索・操作系タブに囲まれた統計閲覧UIで、文脈がずれている。

## Goals / Non-Goals

**Goals:**
- 「閲覧（左）」vs「操作（右）」という明確な軸でUIを再整理する
- 各パネルのタブ数を削減し、役割を明確にする
- Connect 機能をなくさず、より発見しやすい場所に移動する
- 4つのフェーズに分割し、各フェーズ単独で動作するよう段階的に実装する

**Non-Goals:**
- Command Palette のパイプライン機能（`select * | mv ...`）の変更
- モバイル対応・レスポンシブ対応
- ActivityBar 自体の廃止

## Decisions

### Phase 1: View ツールバーをキャンバス左上に移動

**決定**: `CanvasViewToolbar` コンポーネントを新規作成し、`App.tsx` のキャンバス領域内の `absolute` 要素として配置する。左パネルが開いている場合も被らないよう、左パネル幅（456px）を考慮した `left` 値を設定するのではなく、キャンバス自体が左パネルの右側に配置されているため自然に避けられる。

```
LEFT(456px) | CANVAS | RIGHT(56px〜456px)
            ↑
            CanvasViewToolbar は CANVAS 内の absolute top-4 left-4
```

**ボタン構成（左から右）**:
- `〰` Lineage エッジ表示切り替え（青: ON / 薄: OFF）
- `⠿` ER エッジ表示切り替え
- `🏷` Annotations 表示切り替え（amber: ON）
- `≡` Columns 表示切り替え（Compact Mode）
- `|` 区切り
- `⎔` Auto Layout ボタン

ActivityBar から View セクションと Auto Layout ボタンを削除する。

---

### Phase 2: 左パネルに Stats タブを追加

**決定**: `ModelStatsTab` のロジックをそのまま `StatsTab` として左パネルに移植する。左パネルのタブUIを `YAML | Stats` の2タブに変更する。

`activeTab` の型を `'editor' | 'entities' | 'connect'` → `'yaml' | 'stats'` に変更。`'editor'` → `'yaml'` のリネームは `useStore.ts` と `Sidebar.tsx`、`App.tsx`（`L` キーショートカット）で対応。

右パネルから `ModelStatsTab` と `stats` タブを削除。`activeRightPanelTab` の型から `'stats'` を除外。

---

### Phase 3: 右パネルの Search + Tables 統合

**決定**: 新規 `SearchTab` コンポーネントを作成。内部状態として `query: string` を持つ。

```
query === '' → ドメイン階層ツリー（現 TablesTab と同等）
query !== '' → フルテキスト検索結果（現 InformationSearchTab と同等）
```

既存の `TablesTab` と `InformationSearchTab` を `SearchTab` に統合後、両ファイルを削除。`activeRightPanelTab` の型から `'information-search'` と `'tables'` を除去し `'search'` に統一。

---

### Phase 4: Connect を Command Palette に統合

**決定**: `CommandPalette.tsx` に Connect モードを追加する。Palette を開いた直後に `[Pipeline] [Connect ER] [Connect Flow]` のモード選択を表示し、Connect モードを選ぶと Source/Target 入力フォームに切り替わる。

候補表示はグループ表示に改善する：
- テーブル行: アイコン + table.id（太字）
- カラム行: インデント + `· column.id`（細字）
- Bulk候補: `⚡ *.column_id [Bulk]`（専用行として最下部）

`L` キーショートカット（QuickConnect タブを開く）は `Ctrl+K`（Command Palette）に統合し、`L` キーを廃止する。

`QuickConnectTab.tsx` を削除し、`Sidebar.tsx` から Connect タブ参照を除去。

## Risks / Trade-offs

**[リスク] Phase 4 の Command Palette 統合は既存 Pipeline UI の変更を伴う**
→ Pipeline と Connect を「モード」として並列に置く設計にすれば既存 Pipeline 機能には影響しない。

**[リスク] Phase 2 の activeTab 型変更は store の persist に影響する可能性**
→ localStorage に保存された古い `activeTab` 値（`'editor'`, `'connect'`）が読み込まれると不整合になる。`Sidebar.tsx` でのタブ表示ロジックに fallback を入れておく（未知の値は `'yaml'` にフォールバック）。

**[トレードオフ] L キーショートカットの廃止**
→ `L` でQuickConnectを開くショートカットが消える。Phase 4 完了後に Shortcut Guide から削除し、`Ctrl+K` で代替できることをガイドに明記する。

**[トレードオフ] View ツールバーがキャンバスに重なる**
→ 背景をセミ透明（backdrop-blur）にし、キャンバス操作の邪魔にならないよう最小限のサイズに留める。connectMode 表示バナー（上部中央）と視覚的に重ならない位置（左上）に配置。
