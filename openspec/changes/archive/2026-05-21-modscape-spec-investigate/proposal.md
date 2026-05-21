## Why

SDD ワークフローには「AI がユーザーに確認事項を問う」フロー（questions.md）はあるが、「ユーザーが AI に調査を委ねる」逆方向のフローが存在しない。実装後に既存テーブルとの値差異が発覚したケースなど、AI がリポジトリ内のファイル（SQL・dbt モデル・spec・model.yaml）を静的に読んで比較・解析できる調査タスクが実際に発生するにもかかわらず、その発見を design.md に記録する標準的な経路がない。

## What Changes

- **新規追加**: `/modscape:spec:investigate <name>` スキル（claude / codex / gemini の 3 テンプレート）
  - ユーザーが自由記述で調査内容を渡す
  - AI がリポジトリ内の関連ファイルを読んで静的解析・比較を行う
  - 発見を design.md の `## Findings` に記録する
  - 実装修正が必要な場合は implement の inline fix フローへ案内する
- **更新**: `help.md`（claude / codex / gemini）に新コマンドを追記
- **更新**: `status.md`（claude / codex / gemini）の next-command ロジックに追記
- **更新**: `src/template-files.js` の `SPEC_SKILL_NAMES` に `investigate` を追加

## Capabilities

### New Capabilities

- `sdd-investigate`: ユーザー起点の静的調査タスクを受け付け、発見を design.md に記録するスキル

### Modified Capabilities

なし

## Impact

- `src/templates/claude/spec/investigate.md` 新規作成
- `src/templates/codex/modscape-spec-investigate/SKILL.md` 新規作成
- `src/templates/gemini/modscape-spec-investigate/SKILL.md` 新規作成
- `src/templates/claude/spec/help.md` 更新
- `src/templates/codex/modscape-spec-help/SKILL.md` 更新
- `src/templates/gemini/modscape-spec-help/SKILL.md` 更新
- `src/templates/claude/spec/status.md` 更新
- `src/templates/codex/modscape-spec-status/SKILL.md` 更新
- `src/templates/gemini/modscape-spec-status/SKILL.md` 更新
- `src/template-files.js` 更新
