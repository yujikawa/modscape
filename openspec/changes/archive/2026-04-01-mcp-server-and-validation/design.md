## Context

現在、AIエージェント（Claude Code）がmodel.yamlを操作する際は、CLIコマンドを組み立てて実行するか、YAMLを直接生成するかのどちらかに依存している。どちらも「AIがYAML構造の知識を持つ必要がある」ため、ルール違反（座標のtables内記述、lineageの誤配置など）が頻発しフィードバックループがない。

操作ロジックはCLIコマンドのaction内に直書きされており、再利用できない構造になっている。

## Goals / Non-Goals

**Goals:**
- CLIとMCPが同一のオペレーション関数を呼び出す共通層を作る
- Claude CodeからMCP経由でmodel.yamlを安全に操作できるようにする
- model.yamlの構造的問題をCLI・MCPの両方から即時検出できるようにする
- `modscape init --claude` でMCPセットアップ手順を案内する

**Non-Goals:**
- Gemini CLI / Codex CLI のMCP対応
- MCP HTTP transportモード
- AIによる自動モデル生成（スキャフォールディング）

## Decisions

### 1. ディレクトリ構造

**決定**: ロジックを `src/operations/` に、CLIコマンド定義を `src/cli.js` に一本化する。

**理由**: ロジックとインターフェースを明確に分離する。既存の `table.js`, `domain.js` 等はCLIコマンド定義とロジックが混在しているため、`cli.js` に集約することで「どこにCLIコマンドが定義されているか」が一目でわかる。ユーザーが叩くコマンド（引数・サブコマンドの構造）は変わらない。

**代替案1**: 既存の `table.js` 等に関数をexportして再利用（却下：ファイルの役割が曖昧になる）
**代替案2**: MCPに独自ロジックを持たせる（却下：重複実装・整合性リスク）

```
src/
  operations/
    table.js        ← addTable(), updateTable(), removeTable(), listTables(), getTable()
    column.js       ← addColumn(), updateColumn(), removeColumn(), listColumns()
    relationship.js ← addRelationship(), removeRelationship(), listRelationships()
    lineage.js      ← addLineage(), removeLineage(), listLineages()
    domain.js       ← addDomain(), updateDomain(), removeDomain(), listDomains(), getDomain()
                       addDomainMember(), removeDomainMember()
  cli.js            ← 全CLIコマンド定義（operations/* を呼ぶ）
  mcp.js            ← 全MCPツール定義（operations/* を呼ぶ）
  validate.js       ← バリデーションロジック
  index.js          ← エントリポイント（cli.js と mcp.js を呼ぶ）
```

各operations関数のシグネチャ：
```js
// 成功時: 結果データを返す
// 失敗時: Error をthrow（message にエラー内容）
export function addTable(filePath, { id, name, type, logicalName, physicalName, description })
```

### 2. MCPツールの網羅範囲

**決定**: operations層と1対1対応するツールを全て提供する。以下のツールを実装する。

| ツール | 対応するops関数 |
|--------|----------------|
| `list_tables` | listTables() |
| `get_table` | getTable() |
| `add_table` | addTable() |
| `update_table` | updateTable() |
| `remove_table` | removeTable() |
| `add_column` | addColumn() |
| `update_column` | updateColumn() |
| `remove_column` | removeColumn() |
| `list_columns` | listColumns() |
| `add_relationship` | addRelationship() |
| `remove_relationship` | removeRelationship() |
| `list_relationships` | listRelationships() |
| `add_lineage` | addLineage() |
| `remove_lineage` | removeLineage() |
| `list_lineages` | listLineages() |
| `add_domain` | addDomain() |
| `remove_domain` | removeDomain() |
| `list_domains` | listDomains() |
| `add_domain_member` | addDomainMember() |
| `remove_domain_member` | removeDomainMember() |
| `validate` | validateModel() |

**理由**: CLIで操作できることはMCPでも全て操作できるべき。ツールが対称的だとAIが覚えやすい。

### 3. バリデーションのチェック項目

**決定**: 以下をチェックする `src/validate.js` を実装する。

| カテゴリ | チェック内容 |
|----------|-------------|
| 構造 | `tables` が存在するか |
| 構造 | 全テーブルに `id` と `name` があるか |
| 構造 | ID の重複がないか（tables, domains, relationships, lineage） |
| 構造 | `tables` や `domains` 内に座標フィールド（x/y/width/height）がないか |
| 参照 | `relationships` の from/to テーブルIDが存在するか |
| 参照 | `lineage` の from/to IDが tables または consumers に存在するか |
| 参照 | `layout` のキーが tables または domains に存在するか |
| 参照 | `domains[].members` のIDが tables に存在するか |
| 座標 | `layout` の x/y が40の倍数か |

出力形式（`--json`）：
```json
{
  "valid": false,
  "errors": [
    { "type": "error", "field": "layout.dim_customer.x", "message": "x must be a multiple of 40 (got 45)" }
  ],
  "warnings": []
}
```

### 4. MCPのトランスポート

**決定**: stdio transport のみ実装する。

**理由**: ローカル開発用途に特化。ネットワーク不要・認証不要・設定が単純。HTTP transportは将来の拡張として設計の余地を残すが今回は実装しない。

### 5. `init --claude` のMCP案内

**決定**: `modscape init --claude` の完了後に以下を表示する。案内のみで自動設定はしない。

```
  To use the MCP server with Claude Code, run:
  claude mcp add modscape -- modscape mcp
```

**理由**: `~/.claude.json` はユーザーの個人設定ファイル。CLIツールが勝手に書き込むべきでない。

## Risks / Trade-offs

- **リファクタリングのデグレ** → 各ops関数はCLIのexistingテストが通ることで確認する。外部インターフェースを変えないため影響範囲は限定的。
- **opsの引数設計がCLIとMCPで微妙にずれる可能性** → CLIはCommander経由でcamelCaseオプション、MCPはzodスキーマでsnake_caseパラメータを受け取る。ops関数はcamelCaseで統一し、MCPレイヤーで変換する。
- **`@modelcontextprotocol/sdk` のバージョン依存** → 現在1.29.0。MCPプロトコルは急速に進化中のため、将来的にAPIが変わる可能性あり。ただし現時点での対応は最小限に留める。
