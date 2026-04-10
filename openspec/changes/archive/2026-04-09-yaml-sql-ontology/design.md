## Context

SDD implement スキルが生成する SQL の精度は約55%にとどまっており、残り45%はAIが変換式・JOIN種別・特殊列の役割を推測している。推測の不確実性を排除するには、「何が存在するか」だけでなく「どう変換するか」をYAMLで表現できる必要がある。すべて optional フィールドの追加のみで実現し、後方互換を完全に維持する。

## Goals / Non-Goals

**Goals:**
- `columns[].expression` で列の変換式を明示できるようにする
- `lineage[].join_type` でJOIN種別を明示できるようにする
- `implementation.incremental_key` でインクリメンタル比較列を明示できるようにする
- `implementation.scd2` でSCD Type2の列役割を明示できるようにする
- 既存 YAML の後方互換を完全に維持する

**Non-Goals:**
- WHERE句のビジネスフィルター条件（スコープ外）
- ウィンドウ関数・UNION の完全なモデル化
- SQL の決定論的な生成エンジン（あくまでAIへのヒント精度向上）

## Decisions

### 1. `derivation` ラッパーを設けず `expression` を列直下に置く

**決定:** `columns[].expression` をフラットに配置する（`derivation.expression` ではない）。

**理由:** `derivation` ラッパーが提供するものは `expression` 1フィールドのみであり、ネストは冗長。列定義の読みやすさを損なわない最小構造が適切。

```yaml
columns:
  - id: amount_usd
    expression: "CAST(raw.orders.amount AS DECIMAL(18,2)) * fx.rate"
    logical:
      name: Amount USD
      type: Decimal
```

### 2. `expression` は自由記述SQLとする

**決定:** ツール固有の構文（`{{ source() }}` など）も含む自由記述を許容する。バリデーションは構文チェックを行わず、空でないことのみを確認する。

**理由:** dbt・SQLMesh・BigQuery など複数ツールへの対応を想定すると、ツール中立なIR（中間表現）を定義するコストが高すぎる。自由記述にしてAIの解釈に委ねる方が現実的。

### 3. `lineage[].join_type` の `none` はCTE/サブクエリを意味する

**決定:** `none` = JOINせず取り込む（CTEとして参照するが明示的なJOIN句を生成しない）を表す。

**理由:** mart テーブルで「集計のためにデータを流すが結合はしない」ケースが多く、`inner`/`left`/`cross` に収まらないパターンが存在する。

**採用値:** `inner` | `left` | `cross` | `none`

### 4. `implementation.scd2` を `implementation` 直下に置く

**決定:** `appearance.scd: type2` が設定されているテーブルに対して `implementation.scd2` サブセクションで列役割を明示する。

**理由:** 既存の `appearance.scd` フィールドは型の宣言のみ。列役割（どの列がビジネスキーか等）は実装の詳細であり `implementation` に属するのが自然。

```yaml
implementation:
  materialization: table
  scd2:
    business_key: [customer_id]
    valid_from: eff_start_date
    valid_to: eff_end_date
    current_flag: is_current    # optional
```

## Risks / Trade-offs

- **`expression` に方言依存の構文が入るリスク** → `rules.md` でツール中立な書き方を推奨し、ツール固有構文を使う場合は `metadata.sql_tool` で明示する運用を推奨する
- **`expression` が陳腐化するリスク** → YAMLはドキュメント兼ヒント。実SQL変更時に `expression` 更新を忘れる可能性がある。SDD の `design` スキルに「既存SQLから `expression` を抽出する」ステップを追加して同期コストを下げる
- **SCD2以外のSCDへの拡張** → 今回は type2 のみ。type1/type3/type6 は別途検討

## Migration Plan

1. `schema.ts` の型定義に optional フィールドを追加（既存の読み込みに影響なし）
2. `rules.md` に新フィールドのドキュメントを追加
3. README / CLAUDE.md の YAML例に追加
4. SDD implement スキルが新フィールドを参照するよう更新
5. Gemini / Codex への同期

ロールバック: 全フィールドが optional のため、YAML から削除するだけで元の状態に戻る。
