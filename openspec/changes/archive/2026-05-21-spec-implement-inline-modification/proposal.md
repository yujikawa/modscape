## Why

`/modscape:spec:implement` の実装中にユーザーが仕様の修正を依頼した場合、現行の「設計変更」パスは `design.md` に Findings を記録するだけで停止し、`/modscape:spec:design` の再実行を案内する。しかし AI がすでに design.md と spec-model.yaml を更新できるなら、コマンドを切り替えずそのままインラインで完結させる方が自然であり、ユーザーが毎回手動でコマンドを打ち直す手間をなくせる。

## What Changes

- **廃止**: 「設計変更」パスにおける `/modscape:spec:design` への案内ロジックを削除する
- **新規**: ユーザーが明示的に仕様修正を依頼した場合、AI がインラインで以下を一括更新する:
  1. `design.md` 更新
  2. `spec-model.yaml` 更新（mutation CLI）
  3. `tasks.md` 更新（影響タスクを `[ ]` に戻す、または新規タスクを追加）
- **変更**: 更新完了後の案内を「実装を続けますか？（はい/いいえ）」の一言確認に統一する
- テンプレート対象: Claude / Gemini / Codex の 3 プラットフォーム

## Capabilities

### New Capabilities

- `spec-implement-inline-modification`: ユーザーが実装中に修正を依頼した際に、design.md + spec-model.yaml + tasks.md を一括更新するインライン修正フロー

### Modified Capabilities

- `sdd-implement`: 「設計変更を伴う修正」のシナリオ要件を変更。Findings 記録 → 停止 → `/spec:design` 案内というフローを廃止し、3 ファイル一括更新 → 続行確認フローに置き換える

## Impact

- `src/templates/codex/modscape-spec-implement/SKILL.md`
- `src/templates/gemini/modscape-spec-implement/SKILL.md`
- `src/templates/claude/modscape-spec-implement/SKILL.md`（存在する場合）
- `openspec/specs/sdd-implement/spec.md`（要件更新）
