## Context

ターミナルバー（`TerminalBar.tsx`）は `executeCommand()` をZustandストアに持ち、スラッシュコマンドを既存のストア関数にルーティングする構造になっている。追加・接続・削除・移動コマンドはすでに実装済みで、今回はRead・Update系と削除の拡張を追加する。

`removeEdge(sourceId, targetId, kind)` は src+tgt で検索している。2.5.0 で `relationships[].id` / `lineage[].id` が追加されたが、このメソッドは更新されていないため、IDで直接エッジを削除できない状態になっている。

## Goals / Non-Goals

**Goals:**
- `/get` `/rename` `/label` `/col add` `/col rm` コマンドを `executeCommand` に追加
- `/del <edgeId>` でエッジIDを指定して削除できるよう `/del` ルーティングを拡張
- `removeEdge()` をID検索にも対応させる
- 全新規コマンドの第1引数（ID）にTab補完を追加。`/col rm` の第2引数はカラムIDに絞る

**Non-Goals:**
- `/col add` でのカラムの型・説明など詳細フィールドの設定（最小構成のカラム追加のみ）
- マクロ・スクリプト系（複数コマンドの連結）
- カラムの更新（`/col update`）

## Decisions

### `/del` のルーティング拡張

```
/del <id> の解決順序

1. tables に id が一致 → removeNode(id)
2. domains に id が一致 → removeNode(id)
3. relationships に id が一致 → removeEdge(id 検索で削除)
4. lineage に id が一致 → removeEdge(id 検索で削除)
5. 該当なし → error
```

サブコマンド（`/del er` / `/del ln`）形式は採用しない。エッジにIDがある以上、種別を意識させる必要がない。

### `removeEdge()` の修正方針

既存の `removeEdge(sourceId, targetId, kind)` に加えて、IDによる削除パスを追加する。シグネチャは変えず、`sourceId` がエッジIDと一致した場合はIDで削除するフォールバックを入れる。または `removeEdgeById(id)` を新関数として追加する方が副作用が少ない。

→ **`removeEdgeById(id)` を新関数として追加する**。既存の `removeEdge` の呼び出し箇所を壊さないため。

### Tab補完の設計

エッジIDはスキーマから動的に収集する：

```ts
const edgeIds = [
  ...(schema?.relationships ?? []).map(r => ({ id: r.id, label: r.id, desc: `${r.from.table} → ${r.to.table}` })),
  ...(schema?.lineage ?? []).map(l => ({ id: l.id, label: l.id, desc: `${l.from} → ${l.to}` })),
]
```

`/del` の補完候補：テーブルID + ドメインID + エッジID をまとめて提示。

### `/get` の出力フォーマット

ヒストリエリアは複数行対応しているため、詳細表示は複数行で出力する。

```
fct_orders  (fact)  [sales_ops]
  columns : order_id*, customer_id†, amount, created_at
  er      : fct_orders → dim_customers (one-to-many)
  lineage : fct_orders → mart_summary
  * PK  † FK
```

### `/rename` の対象範囲

`renameTableId()` はテーブルIDの変更と参照追従（relationships, lineage, layout, domains.members）をすでに実装している。ドメインIDの変更は `updateDomain()` + layout・members の手動追従が必要。今回はテーブルのみ `renameTableId()` を使い、ドメインは `/rename` 対象外とする（エラーを返す）。

## Risks / Trade-offs

- **`/col add` の最小構成** — `id` だけ持つカラムを追加するため、`logical.name` 等が未設定になる。Detail Panelで後から編集できるため許容。
- **`renameTableId` のみ対応** — ドメインIDの参照追従が手動実装になるため今回は対象外。将来的に `renameDomainId()` を追加すれば対応可能。
