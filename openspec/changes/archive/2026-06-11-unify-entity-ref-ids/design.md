## Context

modscapeのSDD関連YAMLファイル（`_glossary.yaml` / `_questions.yaml` / `_context.yaml`）は、エンティティへの参照を持つフィールドをそれぞれ独自の名前で定義している。

| ファイル | 現フィールド | 型 | 問題 |
|---|---|---|---|
| `_glossary.yaml` | `terms[].tables` | string[] | テーブル限定に見える |
| `_questions.yaml` | `questions[].table` | string（単数） | テーブル限定かつ1件のみ |
| `_context.yaml` | `decisions[].` — なし | — | エンティティ参照がない |

将来、リレーション・ドメイン・メトリクス・コンシューマー等への参照が必要になる場面（OSI export等）を見据え、フィールド名を `ids`（string[]）に統一する。  
`_context.yaml` の decisions については、archiveスキルがStep 2でAffected Tablesを既に把握しているため、archive時に自動付与できる。

## Goals / Non-Goals

**Goals:**
- `terms[].tables` → `ids`（string[]）
- `questions[].table` → `ids`（string[]）
- `decisions[].ids`（string[], optional）の追加
- archiveスキル3プラットフォームの Step 5 更新
- `src/export.js` の `loadContext` のフィールド名対応
- 既存データ・フィクスチャのフィールド名移行

**Non-Goals:**
- `ids` の値の型バリデーション強化（今回はstring[]のまま）
- OSI export の実装（本変更は export の前提整備）
- `_glossary.yaml` の `columns` フィールドの変更

## Decisions

### 1. `ids` は string[]（複数形）に統一

`questions[].table` は現在 string（単数）だが、今後「このQ&Aはリレーションとテーブル両方に関係する」等の場合に備え `ids: string[]` に統一する。  
既存の `table: fct_orders` は `ids: [fct_orders]` に機械的に変換できる。

### 2. `decisions[].ids` はオプション

既存のdecisionsはエンティティ参照を持たない。必須にすると既存データが全て無効になるため任意フィールドとする。  
新規decisions（archiveスキル経由）は `ids` を持つ。レガシーdecisionsは空のまま有効。

### 3. archiveスキルは Affected Tables を自動的に `ids` に変換

Step 2で分類するAffected Tables（Direct Impact + Downstream Impact — Implement + Downstream Impact — Context Only）のIDを `ids` としてdecisionsに付与する。

```yaml
# 例
decisions:
  - id: D-005
    summary: "fct_orders の status カラムで注文状態を管理"
    date: 2026-06-11
    change: add-order-status
    ids: [fct_orders, rel_orders_customers]   ← Step 2から自動付与
```

### 4. 既存データの移行はファイル直接編集（migration コマンドは作らない）

対象ファイルは `.modscape/specs/` 配下の3ファイルのみ。エントリ数が少なく、フィールド名のリネームだけなので手作業で十分。サンプル・フィクスチャは実装タスクで対応。

## Risks / Trade-offs

- **BREAKING変更** → `terms[].tables` と `questions[].table` を参照している外部コードがあれば壊れる。`src/export.js` の `loadContext` は本変更で同時対応するため問題なし。他の読み取り箇所（visualizer の TypeScript 型等）は影響調査が必要。
  - Mitigation: 実装前に `grep -r "\.tables\b\|questions.*table"` で全参照を洗い出す

- **archiveスキルの `ids` 付与漏れ** → `design.md` に `## Affected Tables` セクションがない古いchangeをarchiveする場合、Affected TablesがないためStep 2で空リストになりうる。
  - Mitigation: SKILL.mdに「Affected Tablesがない場合は `ids` を省略する」と明記

## Migration Plan

1. `src/export.js` の `loadContext` を更新（`tables` → `ids`、`table` → `ids[0]`互換読み取り）
2. visualizer の TypeScript 型定義を更新
3. SKILL テンプレート3プラットフォームを更新
4. 既存データファイル（`.modscape/specs/_glossary.yaml` / `_questions.yaml`）を手動更新
5. tests/fixtures の更新

## Affected Tables

### Direct Impact
- fct_orders（サンプルデータ更新）
- dim_customers（サンプルデータ更新）

### Downstream Impact — Context Only
- （特になし）
