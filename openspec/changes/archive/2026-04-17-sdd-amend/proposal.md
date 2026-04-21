## Why

SDD ワークフローで実際に SQL を実装・実行すると、データ型の相違・JOIN 前提の崩れ・カラム名の誤りなど、設計時には気づけなかった問題が頻繁に発生する。現状のワークフロー（requirements → design → implement → archive）にはこれを受け取るステップがなく、発見した問題を spec.md / design.md / tasks.md に反映する方法が暗黙的な手動編集しかない。

## What Changes

- 新スキル `/modscape:spec:amend <name>` を追加する
  - 発見した問題・エラー・設計変更をユーザーが自由記述で渡すと、AI が spec.md / design.md / tasks.md / questions.md の該当箇所を差分更新する
  - 何度でも呼び出せる「割り込み系コマンド」として設計する（フローのステップではない）
  - 完了済みタスク（`- [x]`）は保持したまま修正タスクを追加する

## Capabilities

### New Capabilities
- `sdd-amend`: 実装中に発覚した問題を受け取り、SDD 成果物（spec.md / design.md / tasks.md / questions.md）を差分更新するスキル

### Modified Capabilities
（なし）

## Impact

- `src/templates/claude/spec/amend.md`（新規）
- `src/templates/gemini/modscape-spec-amend/SKILL.md`（新規）
- `src/templates/codex/modscape-spec-amend/SKILL.md`（新規）
