## Why

modscape:spec のスキルコマンド群において、`amend` / `save` / `load` の 3 コマンドは実際にはほぼ使用されておらず、存在していること自体がスキルセットを複雑に見せる原因になっている。また `check` コマンドは固定のペアワイズ比較を行うのみで「どのアーティファクトが正（SSOT）か」を考慮しないため、整合性チェックとして機能が弱い。これら不要・弱体なコマンドを整理し、スキルセットをシンプルかつ実用的にする。

## What Changes

- **削除**: `amend` スキル（claude / codex / gemini の 3 テンプレート）
  - 実装後の修正フローは `implement` スキルの inline 修正プロトコルで完全にカバー済み
- **削除**: `save` / `load` スキル（claude / codex / gemini の各 3 テンプレート、計 6 ファイル）
  - 実際の利用実績がなく、セッション状態の外部保存は現行ワークフローに不要
- **削除**: 上記スキルへの参照を他スキルファイルから除去
  - `save`/`load` 参照: `design.md`, `help.md`, `implement.md`, `requirements.md`（+ codex/gemini）
  - `amend` 参照: `answer.md`, `help.md`, `status.md`（+ codex/gemini）
- **再設計**: `check` スキルを SSOT 指定型の整合性チェッカーに刷新
  - デフォルト SSOT: `spec-model.yaml`
  - オプション: `--from design.md` または `--from spec.md` で SSOT を切り替え可能
  - 出力: 「指定 SSOT から見て、どのアーティファクトの何が食い違っているか」を明示

## Capabilities

### New Capabilities

- `sdd-check`: SSOT 指定型の整合性チェッカー（既存コマンドの再設計）

### Modified Capabilities

- `sdd-amend`: 削除（要件レベルで廃止）
- `sdd-save`: 削除（要件レベルで廃止）

## Impact

- `src/templates/claude/spec/`: `amend.md`, `save.md`, `load.md` 削除、`check.md` 全面改訂
- `src/templates/codex/`: 対応する 4 スキルディレクトリを削除 / 改訂
- `src/templates/gemini/`: 対応する 4 スキルディレクトリを削除 / 改訂
- 参照ファイルの更新: `help.md`, `implement.md`, `design.md`, `requirements.md`, `answer.md`, `status.md`（claude / codex / gemini）
- `openspec/specs/sdd-amend/`, `openspec/specs/sdd-save/` のスペックを廃止扱いに更新
