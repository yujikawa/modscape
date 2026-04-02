## Why

MCPサーバーの導入によりAIエージェントがYAMLモデルを直接編集できるようになったが、AIが「モデル全体を把握する」手段と「設計メモを残す」手段、および「条件付きで検索する」手段が欠落している。これにより、AIが毎回全テーブルを逐一読み込む非効率な操作を強いられており、協力の質がツールの限界で頭打ちになっている。

## What Changes

- **新規**: `annotation` CRUD操作（`operations/annotation.js` + CLI + MCP）
  - YAMLの `annotations` セクションに対するlist/add/update/removeが可能になる
  - AIが設計レビュー結果をビジュアライザー上に直接メモとして残せる
- **新規**: `summarize_model` ツール（`operations/summarize.js` + CLI + MCP）
  - モデル全体の統計情報を1回の呼び出しで返す（テーブル数、型別内訳、孤立テーブル、リネージ深度など）
  - AIのオリエンテーションコスト（逐一読み込み）を大幅に削減する
- **拡張**: `modscape table list` にフィルターオプションを追加
  - `--type <type>` でテーブルタイプ絞り込み
  - `--domain <id>` でドメイン絞り込み
  - `--orphan` でドメイン未所属テーブルの抽出
  - MCPの `list_tables` にも同等のフィルター引数を追加

## Capabilities

### New Capabilities

- `annotation-crud`: annotationセクションに対するCRUD操作（CLI + MCP）
- `model-summary`: モデル全体の統計サマリー取得（CLI + MCP）
- `table-list-filter`: table listコマンドのフィルタリング拡張（CLI + MCP）

### Modified Capabilities

（なし）

## Impact

- `src/operations/annotation.js` — 新規作成
- `src/operations/summarize.js` — 新規作成
- `src/cli.js` — annotationコマンド追加、table listフィルター追加
- `src/mcp.js` — annotation/summarize MCPツール追加、list_tablesフィルター拡張
- `src/index.js` — annotationサブコマンドの登録
- `src/templates/rules.md` — CLI/MCPツール一覧の更新
- `README.md` / `README.ja.md` — CLIリファレンス更新
- `CHANGELOG.md` — 変更履歴追記
