## Context

v2.5.0 で `relationships[].id` および `lineage[].id` が安定した識別子として確立された。
これにより、エッジは単なる接続情報ではなく、ID で一意に参照可能なモデル要素になった。

しかし現状では以下のギャップがある：

| 機能 | relationship | lineage |
|------|:---:|:---:|
| stable id | ✅ | ✅ |
| description フィールド | ❌ | ✅ |
| CLI get | ❌ | ❌ |
| CLI update | ❌ | ✅ |
| UI で ID 表示 | ❌ | ❌ |

このギャップを埋める変更を行う。

## Goals / Non-Goals

**Goals:**
- `relationships[]` エントリに `description` フィールドを追加し、lineage との対称性を確立する
- Detail Panel でエッジの ID を表示・コピーできるようにする
- `modscape relationship get/update` CLI コマンドを追加する
- `modscape lineage get` CLI コマンドを追加する

**Non-Goals:**
- エッジへのアノテーション UI 作成（スキーマ上は対応済みだが、今回は対象外）
- キャンバス上へのエッジラベル描画
- エッジの description を Cytoscape エッジスタイルに反映すること

## Decisions

### D1: `Relationship.description` の扱い

**決定**: `description?: string` を `Relationship` インターフェースに追加。パーサーはそのままパスする（正規化不要）。

**理由**: `LineageEdge.description` と同じ扱い。optional なので既存 YAML との後方互換性を損なわない。

### D2: Detail Panel の ID 表示位置

**決定**: エッジパネルのヘッダー内、サブタイトル行（`from → to` の下）に `ID: <value>` とコピーボタンを追加する。

**代替案**: フッター or ボディ内に表示 → ヘッダーに置く方が「このエッジの識別子」として一目でわかる。

### D3: `relationship update` の設計

**決定**: `--id` または `--from` + `--to` で対象エッジを特定し、`--type` / `--description` で更新する。`lineage update` と同じインターフェースを踏襲する。

```
modscape relationship update <file> --id rel-xxx [--type one-to-many] [--description "..."]
modscape relationship update <file> --from a --to b  [--type ...] [--description "..."]
```

### D4: `relationship get` / `lineage get` の出力

**決定**: `--json` なし → 人間向けのフォーマット、`--json` → JSON オブジェクト1件。`table get` の出力スタイルに準じる。

### D5: `updateLineageDescription` ストアアクションの扱い

**決定**: `updateLineageDescription` は from/to で検索しているが、今後は id ベースに移行すべき。ただし今回は Detail Panel の Relationship description 対応に集中し、lineage 側は既存の実装を維持する。

## Risks / Trade-offs

- **[リスク] `description` の見落れ**: parser.ts で `description` を明示的にパスしないと、YAML 再出力時に欠落する可能性がある → パーサーの `normalizeRelationship` で `description` をコピーすることで対処
- **[リスク] `relationship update` の dedup ロジック**: `sameRel` が from/to テーブルのみで比較しているため、同じテーブル間に複数 relationship がある場合は `--id` 指定を必須にするか警告を出す → `--id` と `--from/--to` の両方を受け付け、`--from/--to` で複数ヒットした場合は `--id` 指定を促すエラーを返す
