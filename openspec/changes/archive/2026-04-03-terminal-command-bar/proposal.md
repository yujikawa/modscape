## Why

現在のCommandPaletteはフルスクリーンのモーダルオーバーレイ（`backdrop-blur`付き）として実装されており、操作中にキャンバスが見えなくなる。グラフツールにとってこれは根本的なミスマッチで、「何と何を繋ごうとしているのか」「どのテーブルがどのドメインにいるのか」を確認しながら操作できない。

また、接続操作（`r`/`l`キー）はconnect modeに入った後もクリックが必要で、キーボードだけで完結しない。

ターミナルバーはvimの`:`コマンドラインを参考にした設計で、キャンバスを常に全表示したままコマンドを入力できる。コマンドはシンプルな引数ベースの文法に統一し、パイプや接続詞（`to`/`->`）を廃止することで入力速度を最大化する。

## What Changes

- **削除**: `CommandPalette.tsx`（モーダルオーバーレイ）を廃止
- **削除**: CytoscapeCanvasの`r`/`l`キー（canvas click-basedのconnect mode）を廃止
- **新規**: `TerminalBar.tsx` — 画面下部に固定されるターミナル型コマンドバー
  - `Ctrl+K` で表示、`Escape` で非表示（トグル）
  - サジェストは上方向にポップアップ（キャンバスを遮らない）
  - `↑`/`↓` キーでコマンド履歴を辿れる
  - コマンド実行後はバーを閉じてキャンバスにフォーカスを戻す
- **変更**: コマンド文法を全面刷新（パイプ廃止、引数ベースに統一）

## コマンド文法

```
t [name]              テーブル追加（name省略→キャンバス中央に追加）
d [name]              ドメイン追加（同上）
c [name]              コンシューマー追加（同上）
s [text]              注釈追加（同上）

er  A.col B.col       ER関係作成（デフォルト: one-to-many）
ln  A B               リネージ作成

mv  pattern domain    テーブルをドメインに移動（globパターン対応）
del pattern           削除（globパターン対応）
find name             検索してフォーカス
fit                   ビューフィット
theme dark/light      テーマ切り替え
```

## Capabilities

### New Capabilities

- `terminal-command-bar`: キャンバスを遮らないターミナル型コマンドUI

### Removed Capabilities

- `command-palette-modal`: モーダルオーバーレイ型のCommandPalette
- `canvas-connect-mode`: `r`/`l`キーによるclick-based接続モード

### Modified Capabilities

- `pipeline-executor`: パイプ構文廃止。コマンドは1文で完結する形に変更

## Impact

- `visualizer/src/components/CommandPalette.tsx` — 削除
- `visualizer/src/components/TerminalBar.tsx` — 新規作成
- `visualizer/src/store/useStore.ts` — `isCommandPaletteOpen` → `isTerminalOpen` へ変更、`executePipeline` をパイプなし文法に対応した `executeCommand` に置き換え
- `visualizer/src/App.tsx` — TerminalBarのマウント、キーボードショートカット更新
- `visualizer/src/components/CytoscapeCanvas.tsx` — `r`/`l`キーハンドラを削除
- `tests/` — スナップショット更新
