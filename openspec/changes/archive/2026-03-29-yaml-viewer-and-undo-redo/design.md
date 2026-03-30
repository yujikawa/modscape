## Context

現在の `EditorTab.tsx` はCodeMirrorによる双方向編集が可能で、YAMLを直接編集するとスキーマが更新される。しかし実際の運用ではYAML編集はVS CodeやAIエージェントが行い、ビジュアライザー内での直接編集は使われていない。

一方、グラフ操作（ノード追加・削除・移動など）のundo/redo手段が存在しない。現在の `EditorTab` にはCodeMirrorのテキスト履歴を使ったUndo/Redoボタンがあるが、これはテキスト編集の範囲にのみ機能し、グラフ操作を戻すことはできない。

Zustand storeには `lastUpdateSource: 'user' | 'visual' | 'undo'` という型定義があり、`'undo'` ソースが最初から想定されていたが、実装されていない。

## Goals / Non-Goals

**Goals:**
- `EditorTab` のCodeMirrorをread-onlyにし、YAMLのビュワーとして機能させる
- Zustand storeにschemaヒストリースタックを追加し、グラフ構造変更操作のundo/redoを実現する
- `Ctrl+Z` / `Ctrl+Shift+Z` のグローバルキーボードショートカットを追加する
- ファイル切り替え時にヒストリーをリセットする
- 履歴上限を50ステップとし、古いエントリを自動削除する

**Non-Goals:**
- テキスト入力フォーム（テーブル名・説明文など）のundo/redo（ブラウザネイティブに委ねる）
- ファイルをまたいだヒストリー
- undo/redoのUI表示（ボタン等）※ キーボードショートカットのみ提供
- `zundo` 等の外部ライブラリの導入（シンプルなスタック実装で十分）

## Decisions

### 1. ヒストリー管理: Zustand内のスナップショットスタック

**決定**: Zustand storeに `schemaHistory: Schema[]` と `historyIndex: number` を追加し、各mutation actionの先頭で `pushHistory()` を呼ぶ。

**代替案:**
- `zundo` ライブラリ: Zustandのmiddlewareとして動作し、全state変更を自動追跡する。しかしUIステート（パネル開閉・テーマなど）まで履歴に入ってしまい、制御が難しい。
- YAML文字列をスナップショットとして保存: `Schema` オブジェクトより大きく、パースコストも発生する。

→ **スタック実装を選択**: スナップショットの対象を `schema` オブジェクトのみに絞れるため、シンプルかつ制御しやすい。

### 2. ヒストリー対象: 構造的変更操作のみ

**決定**: 以下の操作前にのみ `pushHistory()` を呼ぶ:
- `addTable`, `addDomain`, `addConsumer`
- `removeNode`, `bulkRemoveTables`
- `addRelationship`, `addLineage`
- `removeEdge`
- `updateNodePosition`（dragfreeイベントで1回のみ発火）
- `updateNodesPosition`（ドメインdrag end）
- `addAnnotation`, `removeAnnotation`
- `assignTableToDomain`, `bulkAssignTablesToDomain`
- `applyLayout`, `distributeSelectedTables`

**対象外**: `updateTable`、`updateDomain`、`updateConsumer`、`updateAnnotation`（テキスト編集系）

**理由**: テキスト編集はブラウザのネイティブundo/redoで対応可能。誤操作として戻したいのは「削除してしまった」「間違えてドラッグした」といった構造的変更であり、テキスト編集を履歴に含めると有用な履歴が流れてしまう。

### 3. グローバルショートカット: App.tsx でのkeydown監視

**決定**: `App.tsx` に `useEffect` でグローバル `keydown` リスナーを追加する。`document.activeElement` が `INPUT`, `TEXTAREA`, `[contenteditable]` の場合はスキップし、ブラウザのネイティブundo/redoに委ねる。

```
Ctrl+Z (metaKey on Mac)      → store.undo()
Ctrl+Shift+Z (metaKey on Mac) → store.redo()
```

MacとWindowsの両方に対応するため `e.ctrlKey || e.metaKey` を使う。

### 4. YAML Viewer: CodeMirrorをread-onlyに変更

**決定**: `EditorTab.tsx` の `CodeMirror` コンポーネントに `readOnly={true}` を追加し、`onChange` ハンドラー・デバウンスタイマー・Undo/Redoボタンを削除する。`lastUpdateSource: 'user'` の分岐も不要になるため削除する。

タブラベルは "Editor" → "YAML" に変更する（`Sidebar.tsx`）。

## Risks / Trade-offs

**[リスク] スナップショットのメモリ使用量**
→ 上限50ステップに制限し、`pushHistory()` で超えた場合は先頭エントリを削除する。大規模なYAMLでも1スナップショットは数KB程度なので許容範囲。

**[リスク] undo後に再びビジュアル操作すると、redoスタックが消える**
→ 一般的なundo/redoの挙動として許容する（Word・Figmaなど同様）。

**[リスク] `updateTable` など対象外操作との混在時の混乱**
→ テキスト編集はフォームのネイティブundo/redoで処理されるため、ユーザーは文脈に応じてどちらのundo/redoが動いているか直感的に理解できる（テキスト入力中はフォームのundo、それ以外はグラフのundo）。

**[トレードオフ] `updateNodePosition` が毎回履歴に入る**
→ ドラッグは `dragfree` イベントで1回のみ発火するため問題なし。ただし細かい位置調整を繰り返すと履歴が積まれる。許容範囲と判断。
