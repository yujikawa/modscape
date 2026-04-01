## Why

AIエージェント（Claude Code）がmodel.yamlをうまく構築できない問題が発生している。CLIのミューテーションコマンドは存在するが、AIがYAMLを直接生成する場合に座標配置・構造ルールの誤りが多く、フィードバックループがない。MCPサーバーを導入することで「AIが意図を渡すだけ、YAMLの正しさはmodscapeが保証する」構造にし、バリデーション機能で誤り検出を即時化する。

## What Changes

- **共通オペレーション層の新設**: CLIのaction内に分散しているtable/column/relationship/lineage/domainの操作ロジックを `src/operations/` に純粋な関数として切り出す。CLIとMCPの両方がこの関数群を呼び出す。
- **MCPサーバーの追加** (`modscape mcp`): stdio transportでClaude Codeと通信するMCPサーバー。AIエージェントはYAML構造を意識せずにツール呼び出しでモデルを操作できる。
- **バリデーションコマンドの追加** (`modscape validate`): model.yamlの構造的な問題を検出して報告する。`--json` オプションでAIが読みやすい構造化エラーを出力。MCPツールとしても提供。
- **`modscape init --claude` への案内メッセージ追加**: 初期化完了後にMCPセットアップ用コマンドを案内する（自動設定はしない）。

## Capabilities

### New Capabilities

- `mcp-server`: stdio transportのMCPサーバー。Claude Codeからmodel.yamlをツール経由で操作できる。
- `model-validation`: model.yamlの構造的整合性を検証するバリデーション機能。CLIとMCPの両方から利用可能。
- `operations-layer`: CLI・MCPで共有するオペレーション関数群（`src/operations/`）。

### Modified Capabilities

- `model-mutation-commands`: 操作ロジックをoperations層に移譲するリファクタリング。外部インターフェース（CLIコマンドの引数・出力）は変更なし。
- `init-command`: Claude Code向けにMCPセットアップの案内メッセージを追加。

## Impact

- **新規ファイル**: `src/mcp.js`（MCP サーバー）、`src/operations/table-ops.js`、`src/operations/column-ops.js`、`src/operations/relationship-ops.js`、`src/operations/lineage-ops.js`、`src/operations/domain-ops.js`、`src/validate.js`
- **変更ファイル**: `src/table.js`、`src/column.js`、`src/relationship.js`、`src/lineage.js`、`src/domain.js`、`src/init.js`、`src/index.js`
- **新規依存**: `@modelcontextprotocol/sdk`、`zod`
- **CLIの後方互換性**: 維持（既存コマンドの引数・出力は変更なし）
