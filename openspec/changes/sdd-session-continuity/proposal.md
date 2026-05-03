## Why

SDDワークフローは複数のフェーズ（requirements → design → implement → archive）にわたるため、作業が複数のチャットセッションに分断されることが多い。現状では再開時に「どこまで何をやったか」をチャット履歴から探す必要があり、コンテキストの復元に時間がかかる・正確に再開できない問題がある。また、次に何をすべきか分からないという学習コストもあり、チームへの展開を妨げている。

## What Changes

- **`/modscape:spec:save` スキルを新規追加** — フェーズ・会話内容を問わず、現在の作業状態（決定済み事項・未解決事項・次のアクション）を `session.md` に保存する。複数のAIプラットフォーム（Claude / Gemini / Codex）対応。

- **`/modscape:spec:status` スキルを拡張** — 出力末尾に2つのセクションを追加する：
  1. **前回のセッション** — `session.md` が存在する場合、決定済み事項・未解決事項・メモを表示
  2. **次にやること** — 現在のアーティファクト状態とタスク進捗からルールベースで次のアクションを1つ提示

- **既存スキルへの save ヒント組み込み** — `/modscape:spec:design`・`/modscape:spec:requirements`・`/modscape:spec:implement`・`/modscape:spec:amend` の出力に、会話が一区切りついたタイミングで「中断する場合は `/modscape:spec:save` を実行」というヒントを追加する。

- すべての変更を Claude / Gemini / Codex の3プラットフォームに反映する。

## Capabilities

### New Capabilities

- `sdd-save`: `/modscape:spec:save` スキル。現在の会話状態を `session.md` に保存し、翌セッションでの再開を支援する。

### Modified Capabilities

- `sdd-status`: `/modscape:spec:status` スキルに「前回のセッション」表示と「次にやること」推奨を追加。
- `sdd-design`: 出力末尾に save ヒントを追加。
- `sdd-requirements`: 出力末尾に save ヒントを追加。
- `sdd-implement`: 出力末尾に save ヒントを追加。
- `sdd-amend`: 出力末尾に save ヒントを追加。

## Impact

- **新規ファイル**: `src/templates/claude/spec/save.md`、`src/templates/gemini/modscape-spec-save/SKILL.md`、`src/templates/codex/modscape-spec-save/SKILL.md`
- **変更ファイル**: `src/templates/claude/spec/` および対応するGemini/Codexの `status.md`・`design.md`・`requirements.md`・`implement.md`・`amend.md`
- **生成ファイル（実行時）**: `.modscape/changes/<name>/session.md`
- **破壊的変更**: なし
