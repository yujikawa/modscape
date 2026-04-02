## Context

`model.yaml` は Modscape の中核をなすスキーマだが、以下の3層で不整合が蓄積している：

1. **型定義層**（`schema.ts`）: `cluster_by` の欠落、`Relationship.type` に `'lineage'` が残存
2. **パーサー層**（`parser.ts`）: `unique_key`/`partition_by` はスカラーを配列に正規化しているが、rules.md がスカラー形式を正規形として例示している
3. **ドキュメント層**（`rules.md`）: Section 4 の lineage ソース制約が完全例と矛盾、Section 14 欠番

さらに `relationships` と `lineage` エントリに `id` がないため、アノテーションによる参照（`targetType: 'relationship'`）が構造的に機能せず、CLIの dedup ロジックもテーブルペアに依存する脆弱な実装になっている。

本変更はスキーマの**後方互換を最大限維持しながら**、不整合の解消・新フィールドの追加・パーサー堅牢化を行う。

## Goals / Non-Goals

**Goals:**
- `relationships` と `lineage` への `id` フィールド追加（概念上必須、パーサー自動生成でフォールバック）
- `relationship.column` の配列サポート（複合キー表現）
- root-level オプション `version` フィールドの追加
- `annotations.targetType` に `'lineage'` 追加
- `schema.ts` の `Implementation` に `cluster_by: string[]` を追加
- `Relationship.type` から `'lineage'` を除去
- `sampleData` のヘッダー行を parser が検出し警告する
- `rules.md` の誤ったルール・欠番を修正

**Non-Goals:**
- `sampleData` の名前付き行フォーマット（`{ column: value }` 形式）への変更（記述量増加とのトレードオフで今回は見送り）
- ドメインのネスト構造化
- グローバルID名前空間の構造的強制（実行時バリデーションは今回対象外）
- `lineage.from` の配列化（`to` も配列にしたくなり意味が曖昧になるため対象外）

## Decisions

### 1. `id` フィールドは必須とし、パーサーが自動生成でフォールバック

`id` は概念上必須とする。ただし既存 YAML の後方互換のため、`id` が欠落しているエントリに対してパーサーが決定論的に `id` を自動生成する。

**自動生成ルール**:
- `relationship`: `rel-{from.table}.{from.columns.join('+')}-{to.table}.{to.columns.join('+')}` または列なしの場合 `rel-{from.table}-{to.table}-{type}`
- `lineage`: `lin-{from}-{to}`

自動生成された ID は YAML ファイルには書き戻さない（読み取り専用の正規化）。ユーザーが明示的に `id` を付与した場合はその値を優先する。

**CLIの dedup ロジック**:
- 常に `id` で一致判定（`id` がない場合はパーサー自動生成 ID を使用）
- `relationship add` / `lineage add` コマンドの `--id` はオプションとし、省略時はコマンドが上記ルールで自動生成して YAML に書き込む

**Cytoscapeのエッジ ID生成**:
- `edge.id`（パーサー正規化済み）を常に使用する

### 2. `relationship.column` は `string | string[]` をサポート（付属情報のため低リスク）

`column` フィールドは表示用の参考情報であり、カラムレベルの解析機能は現状存在しない。そのため配列化による機能的影響はなく、複合キーの表現力向上のみを目的とした拡張。

パーサーは `column` を常に `string[]` に正規化する（`unique_key` と同じ方針）。
表示・ID 生成では `columns.join('+')` で結合した文字列を使用する。

```
YAML内: column: order_id              → 正規化後: column: ["order_id"]
YAML内: column: [order_id, line_no]   → 正規化後: column: ["order_id", "line_no"]
```

### 3. `sampleData` ヘッダー行の検出ヒューリスティック

最初の行の要素がすべて文字列かつ、テーブルの column `id` リストと一致する場合、ヘッダー行と判断して警告・除去する。完全一致のみに限定し、誤検出を防ぐ。

### 4. `version` フィールドは Schema インターフェースに追加するが使用は任意

初期値は `"2.0.0"`（semver 形式）とする。現時点でバージョン分岐ロジックは実装しない。将来のマイグレーションのための記録用フィールドとして定義のみ行う。

### 5. `rules.md` Section 4 の修正方針

誤り: "MUST NOT define lineage entries for raw tables (fact, dimension, ...) as sources"

正しいルール: `lineage` セクションは**データフローの表現方法**を規定するものであり、何をソース・ターゲットにするかはユーザーが決める。rules.md が規定すべきは「lineage を `relationships` セクションに書いてはならない」という書き方の制約のみ。どのテーブルをつなぐかに対してルールは課さない。

## Risks / Trade-offs

- **relationship `id` の自動補完は行わない**: 既存 YAML に id を自動挿入すると diff が大きくなり、バージョン管理が煩雑になる。ユーザーが必要なときに手動で付与する方針。

## Migration Plan

1. `schema.ts` の型定義を更新（`id` フィールド追加、`cluster_by` 追加、`Relationship.type` 修正）
2. `parser.ts` に後方互換ロジックを追加（`relationship.column` 配列正規化、ヘッダー行検出）
3. `cytoscapeElements.ts` のエッジID生成を `id` ベースに更新
4. `relationship.js` / `lineage.js` の CLI を更新
5. `rules.md` を修正（誤ったルール、欠番、新フィールド追記）
6. サンプルファイル（`samples/`）を新スキーマに合わせて修正

ロールバック戦略: `id` フィールドはオプションなので、旧 YAML はそのまま動作する。新フィールドはすべてオプションのため、既存モデルへのロールバックは不要。

## Open Questions

（Open Questions なし）
