## Why

`tasks` スキルが生成する `tasks.md` のフォーマットが実用に合っていない。Phase名が "Staging/Core/Mart" にハードコードされているため spec-model.yaml の domains と一致しないケースで全フェーズが空になる。また materialization 種別（`[table]` / `[incremental]` / `[view]`）の表示が毎回誤った値を生成するうえ、実装上不要な情報である。

## What Changes

- `[<materialization>]` 表示を tasks.md から削除する
- `← upstream` 記法を tasks.md から削除する（フェーズ順が実装順を表すため不要）
- Phase名をハードコードから廃止し、spec-model.yaml の `domains.name` をトポロジカル順に使用する
- "Phase 4: Tests" を必須セクションから廃止する（必要なら任意で追記可）
- 上記に合わせて tasks-format.md と Claude / Codex / Gemini の各スキルテンプレートを更新する

## Capabilities

### New Capabilities

なし

### Modified Capabilities

- `sdd-tasks`: tasks.md フォーマット要件を刷新（materialization・upstream記法削除、Phase名の動的化）

## Impact

- `src/templates/formats/tasks-format.md` — フォーマットテンプレート更新
- `src/templates/claude/spec/tasks.md` — Claude 向けスキル命令更新
- `src/templates/codex/modscape-spec-tasks/SKILL.md` — Codex 向けスキル更新
- `src/templates/gemini/modscape-spec-tasks/SKILL.md` — Gemini 向けスキル更新
- `openspec/specs/sdd-tasks/spec.md` — 要件定義更新
