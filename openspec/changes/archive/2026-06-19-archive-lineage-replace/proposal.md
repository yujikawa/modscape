## Why

SDD の archive フローで spec-model.yaml をマージする際、リネージのマージが純粋な追加・上書き（upsert）しか行われないため、中間テーブル挿入やリファクタリング案件で古いリネージパスが main-model.yaml に残り続ける。テーブルの削除（`tables_to_remove`）はサポートされているが、リネージの置き換えや削除に相当する機能が欠けており、大規模リファクタリングほど残骸が積み上がる。

## What Changes

- `modscape merge --patch` に `--replace-owned-lineage` フラグを追加する
  - spec-model.yaml の owned テーブル（`isImported !== true`）を自動検出し、「両端が owned テーブル内に収まるリネージ」をマージ前に base から削除する
  - 境界またぎのリネージ（片方だけが owned テーブル）は保持する
- archive スキルが上記フラグを使うよう更新する
- `tables_to_remove` に列挙されたテーブルのリネージを、テーブル削除前に自動クリーンアップする
- spec-config.yaml に `lineage_to_remove` フィールドを追加する（上記自動ロジックで救えないエッジケース向けの明示的脱出口）

## Capabilities

### New Capabilities

- `sdd-archive-lineage-replace`: アーカイブ時に spec スコープ内のリネージを自動置換する能力

### Modified Capabilities

- `sdd-archive`: archive スキルのリネージ処理要件を追記（`lineage_to_remove` サポート、`tables_to_remove` 連動リネージ削除、`--replace-owned-lineage` フラグ利用）

## Impact

- `src/merge.js` — `mergeModelsPatched()` に `replaceOwnedLineage` オプション追加
- `src/templates/claude/spec/archive.md` — Step 2 / Step 2.5 を更新
- `src/templates/codex/modscape-spec-archive` — 同内容を codex 版にも反映
- `src/templates/gemini/modscape-spec-archive` — 同内容を gemini 版にも反映
- spec-config.yaml スキーマ — `lineage_to_remove` フィールドを追加（後方互換）
