## Context

現在のModscapeはMCPサーバーを通じてAIエージェントがYAMLモデルを編集できる。ただし以下の操作が欠落している：

- `annotations` セクションへの読み書き（UIには表示されるがCLI/MCP未対応）
- モデル全体の統計サマリー取得（AIが毎回全テーブルを逐一取得しなければならない）
- テーブルリストのフィルタリング（タイプ・ドメイン・孤立状態で絞り込めない）

既存のアーキテクチャは `operations/<entity>.js` にロジックを集約し、`cli.js` と `mcp.js` から呼び出す統一パターンになっている。この拡張もそのパターンに従う。

## Goals / Non-Goals

**Goals:**
- `annotation` CRUD を `operations/annotation.js` として実装し、CLI + MCP から利用可能にする
- `summarize_model` を `operations/summarize.js` として実装し、CLI + MCP から利用可能にする
- `table list` コマンドに `--type` / `--domain` / `--orphan` フィルターを追加し、MCP の `list_tables` にも同等引数を追加する

**Non-Goals:**
- ビジュアライザー（React側）の変更（annotationはすでにUIで表示済み）
- ローカルLLMや外部AI API との統合
- YAMLスキーマの変更（`annotations` セクションはすでに定義済み）

## Decisions

### 1. `annotation.js` はCRUD4操作を全て実装する

annotationsセクションはYAMLスキーマに存在しており、UIで表示されている。CLIとMCPの両方でCRUDを揃えることで、AIが設計メモを残せるようになる。

- `listAnnotations(file)` → 全annotation一覧
- `addAnnotation(file, { id, type, text, color, targetId, targetType, offset })` → 追加
- `updateAnnotation(file, { id, ...fields })` → 更新
- `removeAnnotation(file, id)` → 削除

idは省略時に `note-{timestamp}` 形式で自動生成する（他の操作との一貫性）。

**なぜ update を含めるか？**: AIが一度書いたメモを修正できる必要があるため。

### 2. `summarize.js` は純粋な集計関数として実装する

`readYaml` で読んだデータを集計するだけの関数。書き込みなし。

```js
summarizeModel(file) → {
  tableCount: number,
  byType: { fact: n, dimension: n, ... },
  domainCount: number,
  domains: [{ id, name, memberCount }],
  orphanTableIds: string[],   // ドメイン未所属
  relationshipCount: number,
  lineageCount: number,
  annotationCount: number,
}
```

リネージ深度（最長パス）は実装コストに見合わないため初期バージョンでは含めない。

### 3. フィルターは `listTables` の引数拡張として実装する

新コマンドを増やさず、既存の `listTables(file, options)` に第2引数を追加する。

```js
listTables(file, { type, domainId, orphanOnly })
```

CLIでは `--type`, `--domain`, `--orphan` オプションとして、MCPでは `list_tables` の任意引数として公開する。

**なぜ既存関数を拡張するか？**: 新コマンドを作らなくて済むため最小変更で済む。後方互換も保てる（引数なしで従来通り動作）。

## Risks / Trade-offs

- [リスク] `annotations[].id` の重複チェック漏れ → `addAnnotation` 時に既存IDチェックを必ず入れる
- [リスク] `--orphan` フィルターがドメインの `members` リストのみを参照するため、`layout[].parentId` との不整合が生じる可能性 → `members` リストを正とし、`parentId` は参照しない（CLAUDEの規定通り）
- [トレードオフ] `summarize` にリネージ深度を含めないことで、複雑なパイプライン分析には別途 `list_lineages` が必要になる → 初期バージョンでは許容する
