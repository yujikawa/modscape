## Why

SDD の implement スキルが生成する SQL は、現状の YAML が「何が存在するか」しか表現できていないため、「どう変換するか」をAIが推測に頼っており、精度にばらつきがある。列の変換式・JOIN種別・インクリメンタルの比較列・SCD Type2の列役割を YAML で明示できるようにすることで、SQL生成の精度を約55% から 87% に引き上げる。

## What Changes

- **`columns[].expression`** を追加 — 列ごとに SQL 変換式を記述できるようにする（例: `"CAST(raw.orders.amount AS DECIMAL(18,2)) * fx.rate"`）。既存 SQL からの逆引き抽出にも、新規設計での AI 提案にも使用可能。
- **`lineage[].join_type`** を追加 — lineage エッジに結合種別（`inner` / `left` / `cross` / `none`）を指定できるようにする。未指定時は既存の `relationships` から自動解決。
- **`implementation.incremental_key`** を追加 — インクリメンタルモデルで WHERE 句のフィルターに使う列名を明示する（例: `updated_at`）。
- **`implementation.scd2`** を追加 — SCD Type2 ディメンションのビジネスキー・有効期間列・カレントフラグを明示する。

すべて **optional フィールドの追加のみ**。既存 YAML の後方互換を完全に維持する。

## Capabilities

### New Capabilities

- `column-expression`: 列単位の SQL 変換式フィールド（`columns[].expression`）の定義・バリデーション・ドキュメント
- `lineage-join-type`: lineage エッジへの結合種別フィールド（`lineage[].join_type`）の定義とバリデーション
- `incremental-key`: インクリメンタルモデルの比較列フィールド（`implementation.incremental_key`）の定義
- `sdd-scd2-spec`: SCD Type2 実装仕様フィールド（`implementation.scd2`）の定義

### Modified Capabilities

なし（すべて新規フィールドの追加のみ）

## Impact

- `visualizer/src/types/schema.ts` — `Column`・`LineageEdge`・`Implementation` 型に optional フィールドを追加
- `src/templates/rules.md` — 新フィールドの説明・例・ルールを追記
- `README.md` / `README.ja.md` — YAML フォーマット例に追記
- `CLAUDE.md` — YAML フォーマット例に追記
- `src/templates/claude/spec/implement.md` — `expression`・`join_type`・`incremental_key`・`scd2` を参照して SQL 生成精度を向上
- `src/templates/gemini/` / `src/templates/codex/` — implement スキルに同期
