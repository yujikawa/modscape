## Context

`src/operations/lineage.js` の `listLineages` はYAMLから `lineage` 配列をそのまま返すだけ。BFSトラバーサルは `extract.js` の `--with-downstream` で実装済みだが、lineage 操作とは分離している。

`lineage list` の現状：
- オプションなし → 全エントリをフラット出力
- `--json` → JSON配列

## Goals / Non-Goals

**Goals:**
- `lineage list --from <id>` で直接の下流エントリを返す（1ホップ）
- `lineage list --from <id> --recursive` でBFS全下流を返す
- `--depth <n>` で再帰の深さを制限できる
- `--json` との組み合わせで AI から機械可読に使える
- SDD `design` スキルの影響範囲確認ステップに利用例を追記

**Non-Goals:**
- 上流（upstream）トラバーサル（`--to` での逆引き）— 今回はスコープ外
- `lineage get` コマンドの変更

## Decisions

### BFS実装の場所

`src/operations/lineage.js` に `listDownstreamLineages(entries, fromId, { recursive, depth })` ユーティリティを追加する。`extract.js` の `--with-downstream` とロジックが重複するが、あちらはテーブル抽出用の別文脈なので分離を維持する。

### 出力形式

`--recursive` 時はエントリのフラット配列（重複なし）で返す。ツリー構造ではなく、各エントリが `from` / `to` / `depth` を持つ形にする。

```
# テキスト出力（--recursive）
  fct_orders --> mart_revenue  (depth: 1)
  fct_orders --> report_daily  (depth: 1)
  mart_revenue --> mart_summary  (depth: 2)

# JSON出力（--recursive --json）
[
  { "from": "fct_orders", "to": "mart_revenue", "depth": 1 },
  { "from": "fct_orders", "to": "report_daily", "depth": 1 },
  { "from": "mart_revenue", "to": "mart_summary", "depth": 2 }
]
```

### SDD design スキルへの統合

`design` スキルの「影響テーブルを調べる」ステップに次の案内を追加する：

```bash
# テーブル変更時の影響範囲を事前確認
modscape lineage list <file> --from <tableId> --recursive --json
```

## Risks / Trade-offs

- [リスク] 循環参照があると無限ループ → BFSの訪問済みセットで防ぐ
- [トレードオフ] `depth` フィールドをJSONに含めると `listLineages` の戻り値と形式が変わる → `--recursive` 時のみ `depth` を付与し、通常の `--from` フィルターでは付与しない
