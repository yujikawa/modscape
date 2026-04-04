## Why

ターミナルバーでYAMLモデルの追加・接続・削除が可能になったが、既存オブジェクトの「参照・更新・エッジ削除」ができないため、キーボードだけで作業を完結できない。IDをYAMLで手動確認する手間をなくし、ターミナル上でCRUDを完結させる。

## What Changes

- **新コマンド `/get <id>`** — テーブル・ドメイン・ERエッジ・lineageの詳細をターミナルに表示
- **新コマンド `/rename <id> <newId>`** — オブジェクトIDの変更（参照を全追従）
- **新コマンド `/label <id> <name>`** — 表示名（name）の変更
- **新コマンド `/col add <tableId> <colId>`** — テーブルへのカラム追加
- **新コマンド `/col rm <tableId> <colId>`** — テーブルからのカラム削除
- **`/del` のエッジID対応** — `relationships[].id` / `lineage[].id` を指定してエッジを削除可能にする（種別指定不要）
- **`removeEdge()` のID検索対応** — 現在 src+tgt で検索している実装をエッジIDでも削除できるよう修正
- **Tab補完の拡張** — 全新規コマンドのID引数にスキーマ上の全ID（テーブル・ドメイン・エッジID）を候補として出す。`/col rm` の第2引数はそのテーブルのカラムIDに絞る

## Capabilities

### New Capabilities

- `terminal-read-commands`: `/get` / `/ls` によるオブジェクト詳細表示とID一覧表示
- `terminal-update-commands`: `/rename` / `/label` / `/col add` / `/col rm` によるオブジェクト更新
- `terminal-edge-deletion`: `/del` でエッジIDを直接指定して削除する機能

### Modified Capabilities

- `command-palette-connect`: ターミナルバーのコマンドセットと補完ロジックに変更が生じる

## Impact

- `visualizer/src/store/useStore.ts` — `executeCommand` に新ルーティング追加、`removeEdge` をID検索対応に修正
- `visualizer/src/components/TerminalBar.tsx` — COMMANDS リスト追加、サジェスト補完ロジック拡張
