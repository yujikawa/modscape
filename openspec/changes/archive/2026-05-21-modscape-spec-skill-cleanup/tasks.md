## 1. スキルファイルの削除（amend / save / load）

- [x] 1.1 `src/templates/claude/spec/amend.md` を削除する
- [x] 1.2 `src/templates/claude/spec/save.md` を削除する
- [x] 1.3 `src/templates/claude/spec/load.md` を削除する
- [x] 1.4 `src/templates/codex/modscape-spec-amend/` ディレクトリを削除する
- [x] 1.5 `src/templates/codex/modscape-spec-save/` ディレクトリを削除する
- [x] 1.6 `src/templates/codex/modscape-spec-load/` ディレクトリを削除する
- [x] 1.7 `src/templates/gemini/modscape-spec-amend/` ディレクトリを削除する
- [x] 1.8 `src/templates/gemini/modscape-spec-save/` ディレクトリを削除する
- [x] 1.9 `src/templates/gemini/modscape-spec-load/` ディレクトリを削除する

## 2. 参照の除去（claude テンプレート）

- [x] 2.1 `src/templates/claude/spec/help.md` から save / load / amend コマンドの記述を除去する
- [x] 2.2 `src/templates/claude/spec/implement.md` から save / load コマンドへの言及を除去する
- [x] 2.3 `src/templates/claude/spec/design.md` から save / load コマンドへの言及を除去する
- [x] 2.4 `src/templates/claude/spec/requirements.md` から save / load コマンドへの言及を除去する
- [x] 2.5 `src/templates/claude/spec/answer.md` から amend コマンドへの言及を除去する
- [x] 2.6 `src/templates/claude/spec/status.md` から amend コマンドへの言及を除去する

## 3. 参照の除去（codex テンプレート）

- [x] 3.1 `src/templates/codex/modscape-spec-help/SKILL.md` から save / load / amend コマンドの記述を除去する
- [x] 3.2 `src/templates/codex/modscape-spec-implement/SKILL.md` から save / load コマンドへの言及を除去する
- [x] 3.3 `src/templates/codex/modscape-spec-design/SKILL.md` から save / load コマンドへの言及を除去する
- [x] 3.4 `src/templates/codex/modscape-spec-requirements/SKILL.md` から save / load コマンドへの言及を除去する
- [x] 3.5 `src/templates/codex/modscape-spec-answer/SKILL.md` から amend コマンドへの言及を除去する
- [x] 3.6 `src/templates/codex/modscape-spec-status/SKILL.md` から amend コマンドへの言及を除去する

## 4. 参照の除去（gemini テンプレート）

- [x] 4.1 `src/templates/gemini/modscape-spec-help/SKILL.md` から save / load / amend コマンドの記述を除去する
- [x] 4.2 `src/templates/gemini/modscape-spec-implement/SKILL.md` から save / load コマンドへの言及を除去する
- [x] 4.3 `src/templates/gemini/modscape-spec-design/SKILL.md` から save / load コマンドへの言及を除去する
- [x] 4.4 `src/templates/gemini/modscape-spec-requirements/SKILL.md` から save / load コマンドへの言及を除去する
- [x] 4.5 `src/templates/gemini/modscape-spec-answer/SKILL.md` から amend コマンドへの言及を除去する
- [x] 4.6 `src/templates/gemini/modscape-spec-status/SKILL.md` から amend コマンドへの言及を除去する

## 5. check スキルの再設計

- [x] 5.1 `src/templates/claude/spec/check.md` を SSOT 指定型（`--from <artifact>`）に全面改訂する
- [x] 5.2 `src/templates/codex/modscape-spec-check/SKILL.md` を claude 版に合わせて改訂する
- [x] 5.3 `src/templates/gemini/modscape-spec-check/SKILL.md` を claude 版に合わせて改訂する

## 6. openspec/specs の廃止記録

- [x] 6.1 `openspec/specs/sdd-amend/spec.md` の先頭に廃止注記（`> **廃止**: ...`）を追記する
- [x] 6.2 `openspec/specs/sdd-save/spec.md` の先頭に廃止注記（`> **廃止**: ...`）を追記する
