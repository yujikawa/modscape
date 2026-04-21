## Why

SDD ワークフローでは `design` スキルをイテレーションするたびに `spec.md` / `design.md` / `tasks.md` / `spec-model.yaml` / `questions.md` が独立して更新される。しかしアーティファクト間の整合性を保証する仕組みがなく、「design.md を変えたが spec.md の AC が古いまま」「tasks.md にないテーブルが design.md の Affected Tables に残っている」といった矛盾を人間が目視で確認しなければならない。`/modscape:spec:validate <name>` を導入することでアーティファクト全体の横断的な整合性チェックを一発で行えるようにする。

## What Changes

- `/modscape:spec:validate <name>` スキルを新規追加（Claude / Gemini / Codex）
- 以下のアーティファクトを横断してチェックする：
  - `spec.md` ↔ `design.md`：要件・AC と設計の整合
  - `design.md` ↔ `tasks.md`：Affected Tables とタスクの整合
  - `design.md` ↔ `spec-model.yaml`：設計テーブルとモデルの整合
  - `questions.md` ↔ `design.md`：未解決Q&Aと仮定の整合
  - `spec.md` ↔ `tasks.md`：AC-NNN とテストタスクの整合（review の既存チェックと差別化した詳細版）
- 矛盾・抜け・ズレをカテゴリ別に報告し、修正ヒントを提示する

## Capabilities

### New Capabilities

- `sdd-validate`: SDD 作業フォルダ内の全アーティファクトを横断して整合性チェックを行うスキル

### Modified Capabilities

（なし）

## Impact

- `src/templates/claude/spec/validate.md` — 新規作成
- `src/templates/gemini/modscape-spec-validate/SKILL.md` — 新規作成
- `src/templates/codex/modscape-spec-validate/SKILL.md` — 新規作成
