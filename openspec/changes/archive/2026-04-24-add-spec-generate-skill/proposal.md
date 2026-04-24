## Why

既存プロジェクトをSDDワークフローに組み込む際、`spec.md`（テーブル別の永続スペック）が存在しない状態からスタートすることになる。現状の`/modscape:spec:archive`は1つのチェンジが完了してはじめてspec.mdを生成するため、数十テーブルが存在するプロジェクトでは「SDDを使い始める前に全テーブルのベースラインスペックが欲しい」というニーズに対応できていない。

## What Changes

- 新スキル `/modscape:spec:generate` を追加する
  - `model.yaml`・SQLファイル・Pythonファイルなど複数種のアーティファクトをインプットとして受け取る
  - 各テーブルの物理テーブル名をIDとして `.modscape/specs/<table-id>/spec.md` を一括生成する
  - 既存のspec.mdはスキップ（上書きしない）
  - 実行開始時に「model.yamlも更新しますか？」を確認する
- Claude Code・Gemini・Codex の3形式でスキルファイルを追加する（CLAUDE.mdルールに従いClaudeを先行実装）

## Capabilities

### New Capabilities

- `spec-generate-skill`: 任意の実装アーティファクト（model.yaml / SQL / Python 等）からテーブルスペック（`specs/<table-id>/spec.md`）を一括生成するスキル

### Modified Capabilities

（なし）

## Impact

- `src/templates/claude/spec/generate.md` — 新規追加（Claude Code スキルの実体）
- `src/templates/gemini/modscape-spec-generate/SKILL.md` — 新規追加
- `src/templates/codex/modscape-spec-generate/SKILL.md` — 新規追加
- `src/init.js` — `modscape init` 実行時のテンプレートコピー対象に追加が必要か確認
- `README.md` / `README.ja.md` — SDDスキル一覧への追記
