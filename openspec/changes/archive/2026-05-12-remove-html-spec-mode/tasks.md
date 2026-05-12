## 1. HTML テンプレート削除

- [x] 1.1 `src/templates/spec/html/spec-template.html` を削除する
- [x] 1.2 `src/templates/spec/html/design-template.html` を削除する
- [x] 1.3 `src/templates/spec/html/tasks-template.html` を削除する
- [x] 1.4 `src/templates/spec/html/questions-template.html` を削除する
- [x] 1.5 `src/templates/spec/html/table-spec-template.html` を削除する

## 2. CLI から HTML モードを削除

- [x] 2.1 `src/index.js` の `init` コマンドから `--html` オプション定義を削除する
- [x] 2.2 `src/index.js` の `update` コマンドから `--html` オプション定義を削除する
- [x] 2.3 `src/init.js` の `--html` フラグ処理（`output_format: html` 書き込みブロック）を削除する
- [x] 2.4 `src/spec.js` の `specNew()` から `html` 分岐（`readSpecConfig().output_format === 'html'`）を削除し、常に `.md` でスキャフォールドするよう変更する

## 3. Claude skill から HTML mode ロジックを削除

- [x] 3.1 `src/templates/claude/spec/check.md` の HTML mode 検出・パース指示（D-1 / Part 2 の dual-path）を削除し、MD のみに統一する
- [x] 3.2 `src/templates/claude/spec/generate.md` の Step 4 から `output_format` 検出とHTML mode 生成ロジックを削除し、常に `.md` を生成するよう変更する
- [x] 3.3 `src/templates/claude/spec/note.md` の Step 1 の output_format 検出、Step 3 の HTML ファイル検索、Step 6 の HTML 書き込みロジックを削除し、MD のみに統一する
- [x] 3.4 `src/templates/claude/spec/requirements.md` の `output_format` 検出と `.html` 生成ロジックを削除する
- [x] 3.5 `src/templates/claude/spec/design.md` の `output_format` 検出と `.html` 生成ロジックを削除する
- [x] 3.6 `src/templates/claude/spec/tasks.md` の `output_format` 検出と `.html` 生成ロジックを削除する
- [x] 3.7 `src/templates/claude/spec/archive.md` の `output_format` 検出と `.html` 拡張子切り替えロジックを削除する
- [x] 3.8 `src/templates/claude/spec/status.md` の `output_format` 検出ロジックを削除する
- [x] 3.9 `src/templates/claude/spec/amend.md` の `output_format` 検出ロジックを削除する
- [x] 3.10 `src/templates/claude/spec/implement.md` の `output_format` 検出ロジックを削除する
- [x] 3.11 `src/templates/claude/spec/answer.md` の `output_format` 検出ロジックを削除する（存在する場合）

## 4. Gemini skill から HTML mode ロジックを削除

- [x] 4.1 `src/templates/gemini/modscape-spec-check/SKILL.md` を Claude 版に合わせて更新する
- [x] 4.2 `src/templates/gemini/modscape-spec-generate/SKILL.md` を Claude 版に合わせて更新する
- [x] 4.3 `src/templates/gemini/modscape-spec-note/SKILL.md` を Claude 版に合わせて更新する
- [x] 4.4 `src/templates/gemini/modscape-spec-requirements/SKILL.md` を Claude 版に合わせて更新する
- [x] 4.5 `src/templates/gemini/modscape-spec-design/SKILL.md` を Claude 版に合わせて更新する
- [x] 4.6 `src/templates/gemini/modscape-spec-tasks/SKILL.md` を Claude 版に合わせて更新する
- [x] 4.7 `src/templates/gemini/modscape-spec-archive/SKILL.md` を Claude 版に合わせて更新する
- [x] 4.8 `src/templates/gemini/modscape-spec-status/SKILL.md` を Claude 版に合わせて更新する
- [x] 4.9 `src/templates/gemini/modscape-spec-amend/SKILL.md` を Claude 版に合わせて更新する
- [x] 4.10 `src/templates/gemini/modscape-spec-implement/SKILL.md` を Claude 版に合わせて更新する

## 5. Codex skill から HTML mode ロジックを削除

- [x] 5.1 `src/templates/codex/modscape-spec-check/SKILL.md` を Claude 版に合わせて更新する
- [x] 5.2 `src/templates/codex/modscape-spec-generate/SKILL.md` を Claude 版に合わせて更新する
- [x] 5.3 `src/templates/codex/modscape-spec-note/SKILL.md` を Claude 版に合わせて更新する
- [x] 5.4 `src/templates/codex/modscape-spec-requirements/SKILL.md` を Claude 版に合わせて更新する
- [x] 5.5 `src/templates/codex/modscape-spec-design/SKILL.md` を Claude 版に合わせて更新する
- [x] 5.6 `src/templates/codex/modscape-spec-tasks/SKILL.md` を Claude 版に合わせて更新する
- [x] 5.7 `src/templates/codex/modscape-spec-archive/SKILL.md` を Claude 版に合わせて更新する
- [x] 5.8 `src/templates/codex/modscape-spec-status/SKILL.md` を Claude 版に合わせて更新する
- [x] 5.9 `src/templates/codex/modscape-spec-amend/SKILL.md` を Claude 版に合わせて更新する
- [x] 5.10 `src/templates/codex/modscape-spec-implement/SKILL.md` を Claude 版に合わせて更新する

## 6. ドキュメント更新

- [x] 6.1 `CHANGELOG.md` の v3.4.0 セクションから HTML mode 関連の記述を削除・修正する
- [x] 6.2 `README.md` から `--html` フラグと HTML mode の記述を削除する
- [x] 6.3 `README.ja.md` から `--html` フラグと HTML mode の記述を削除する
