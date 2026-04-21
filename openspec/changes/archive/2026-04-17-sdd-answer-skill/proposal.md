## Why

`questions.md` に積まれた未解決質問（Q-NNN）に回答するための手段として `modscape spec answer` CLI コマンドが存在するが、このコマンドには2つの問題がある。

1. **AI スキルがないと使われない** — SDD ワークフローは AI 前提の設計であり、CLI コマンドをユーザーが能動的に叩くケースは想定しにくい。`questions.md` への書き込みは単純なテキスト操作であり、CLI である必要はない。

2. **回答の品質が担保されない** — CLI はユーザーが渡したテキストをそのまま書き込むだけ。回答が曖昧・不完全でも指摘されず、設計への影響も判断されない。

AI スキル `/modscape:spec:answer` に一本化することで、追加ヒアリングによる回答の整理と、設計への影響判断までワンコマンドで完結させる。

## What Changes

- `modscape spec answer` CLI コマンドを削除する（`src/index.js` + `src/operations/questions.js`）
- `/modscape:spec:answer` AI スキルを新規作成する（Claude / Gemini / Codex）
  - Q-NNN を指定すると該当質問を表示する
  - ユーザーの回答を受け取り、曖昧・不完全な場合は追加ヒアリングを行う
  - 整理した回答を `questions.md` の該当 Q-NNN に記録する（`- [ ]` → `- [x]`）
  - 回答内容が設計に影響するかを判断し、必要なら `/modscape:spec:design` 再実行を提案する

## Capabilities

### New Capabilities
- `sdd-answer`: Q-NNN への対話的回答記録スキル

### Modified Capabilities
- `sdd-questions`: CLI answer コマンドの削除（CLI から AI スキルへの移行）

## Impact

- `src/index.js` — `spec answer` サブコマンドの削除
- `src/operations/questions.js` — `answerQuestion` 関数の削除（ファイル全体が不要になる場合は削除）
- `src/templates/claude/spec/answer.md`（新規）
- `src/templates/gemini/modscape-spec-answer/SKILL.md`（新規）
- `src/templates/codex/modscape-spec-answer/SKILL.md`（新規）
