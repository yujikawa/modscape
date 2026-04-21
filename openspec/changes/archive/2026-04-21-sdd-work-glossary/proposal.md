## Why

`_questions.yaml` は作業スコープ内の `questions.md` で用語を蓄積し、archive 時に永続化するパターンが成立している。しかし用語集（`_glossary.yaml`）には対応するwork-scopedファイルが存在せず、requirements/answer スキル実行時にしか更新されない。design/implement フェーズで発見されたビジネス用語が記録されない構造的な抜け穴になっている。

## What Changes

- `.modscape/changes/<name>/glossary.md` をwork-scopedな用語集一時ファイルとして追加
- `requirements` / `design` スキルで新用語を `glossary.md` に記録するステップを追加
- `archive` スキルに `glossary.md` → `_glossary.yaml` のマージステップを追加
- `answer` スキルの用語更新先を `_glossary.yaml` 直書きから `glossary.md` 経由に統一（任意）

## Capabilities

### New Capabilities

- `sdd-work-glossary`: SDDワークフロー内でのwork-scoped用語集ファイル（`glossary.md`）の管理と、archive時の`_glossary.yaml`への永続化

### Modified Capabilities

- `sdd-archive`: archiveスキルにglossaryマージステップを追加
- `sdd-requirements`: requirements スキルに `glossary.md` への用語記録ステップを追加
- `sdd-design`: design スキルに `glossary.md` への用語記録ステップを追加

## Impact

- `src/templates/claude/spec/archive.md` — glossaryマージステップ追加
- `src/templates/claude/spec/requirements.md` — glossary.md への記録ステップに変更
- `src/templates/claude/spec/design.md` — glossary.md への記録ステップ追加
- Gemini / Codex 側の対応SKILLも同様に更新（`src/templates/gemini/`, `src/templates/codex/`）
