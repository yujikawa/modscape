## Why

設計・実装フェーズで何かを発見したとき、`spec.md` / `design.md` / `spec-model.yaml` の3ファイルを同時に整合させる手段がなく、いずれかが置き去りになる。特に実装中はコマンドを打たずに会話で修正指示を出すことが多く、スキルが整合チェックをトリガーしないまま進んでしまう。

## What Changes

- **`sdd-amend`（修正）**: `spec-model.yaml` への mutation も担当するよう拡張する。変更適用後に他2ファイルへの波及を確認して報告する。
- **`sdd-design`（修正）**: `spec-model.yaml` 変更後、`spec.md` の Acceptance Criteria に影響がないかを自動確認し、必要なら即座に修正する。
- **`sdd-implement`（修正）**: 実装中にユーザーが会話で「これが違った」と伝えたとき、`amend` 相当の処理をインラインで実行して3ファイルを整合させ、そのまま実装を継続できるようにする。設計変更を伴う場合のみ `design` 再実行を促す。

## Capabilities

### New Capabilities

なし（既存スキルの拡張のみ）

### Modified Capabilities

- `sdd-amend`: `spec-model.yaml` mutation の追加と、変更後の他2ファイル波及確認レポートの追加
- `sdd-design`: `spec-model.yaml` 変更後の `spec.md` AC 整合チェック＆自動修正の追加
- `sdd-implement`: 実装中のインライン発見処理（コマンド不要で3ファイル同時更新）の追加

## Impact

- `src/templates/claude/spec/amend.md`
- `src/templates/claude/spec/design.md`
- `src/templates/claude/spec/implement.md`
- 対応する Gemini / Codex バージョンも同期が必要（Claude Code が先行、他は後追いで可）
