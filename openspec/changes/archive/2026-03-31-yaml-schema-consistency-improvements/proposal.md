## Why

`model.yaml` スキーマの複数箇所で、型定義・ドキュメント・実装コードの間に不整合が生じており、AIエージェントが誤ったYAMLを生成したり、CLIコマンドが正しく機能しない状況が発生している。また `relationships` と `lineage` にIDがないため、アノテーションによる参照や CLI での安定した特定が構造的に不可能になっている。これらを一括して修正・拡張し、スキーマの一貫性・堅牢性・表現力を高める。

## What Changes

- **`relationships` と `lineage` エントリへの `id` フィールド追加**（概念上必須、パーサーが自動生成でフォールバック）
  - `annotations.targetType: 'relationship'` および `'lineage'` が正しく機能するようになる
  - 既存 YAML は `id` がなくてもパーサーが決定論的に自動生成するため後方互換を維持
- **root-level `version` フィールド追加**（オプション）
  - スキーマバージョン管理のための任意フィールド
- **`annotations.targetType` に `'lineage'` を追加**
  - lineage エッジへの注釈付けを可能にする
- **`sticky-annotations` の `targetType: 'relationship'` を実用化**
  - relationship に `id` が付与されることで初めて機能する
- **`relationship.from.column` / `to.column` の配列サポート追加**（複合キーの表現）
  - `column: order_id` と `column: [order_id, line_no]` の両方を受け付ける
  - カラム情報は付属情報なので機能的影響なし。ドキュメント表現力の向上のみ
- **`Relationship.type` から `'lineage'` を除去**（型定義のバグ修正）
- **`implementation` への `cluster_by` 追加**（`schema.ts` の欠落修正）
- **`unique_key` / `partition_by` の正規形ドキュメント化**（パーサーが既に配列に正規化する旨を明記）
- **`sampleData` のヘッダー行自動検出・警告**
- **`rules.md` Section 4 の誤ったlineageソース制約を修正**
  - `fact` テーブルを lineage ソースとして使う例と矛盾するルールを正しい記述に変更
- **Section 14 の欠番を修正**（13 → 15 に飛んでいる）

## Capabilities

### New Capabilities

- `relationship-id`: `relationships` と `lineage` エントリへの `id` フィールド追加（概念上必須、パーサー自動生成でフォールバック。CLI・アノテーション参照を安定化）
- `schema-version`: root-level オプション `version` フィールドの導入
### Modified Capabilities

- `data-lineage`: lineage ソースに関する誤ったルールの修正
- `sticky-annotations`: `targetType` に `'lineage'` を追加、`relationship` targeting が `id` 付与により実用化
- `implementation-hints`: `cluster_by` フィールドを `schema.ts` および rules.md に追加、`unique_key`/`partition_by` の正規形を明記
- `resilient-parser`: `sampleData` ヘッダー行検出・警告、`Relationship.type` から `'lineage'` を除去

## Impact

- `visualizer/src/types/schema.ts` — `Implementation`、`Relationship`、`LineageEdge`、`Annotation`、`Schema` インターフェースの更新
- `visualizer/src/lib/parser.ts` — `sampleData` ヘッダー検出、`relationship.column` 配列正規化
- `visualizer/src/lib/cytoscapeElements.ts` — lineage エッジID生成を `edge.id` ベースに変更（フォールバックとして既存の自動生成を維持）
- `src/relationship.js` — dedup ロジックを `id` ベースに変更（`id` がない場合は from+to ペアにフォールバック）
- `src/lineage.js` — `--type` フラグ追加
- `src/templates/rules.md` — Section 4 ルール修正、Section 14 欠番修正、新フィールドの記載追加
