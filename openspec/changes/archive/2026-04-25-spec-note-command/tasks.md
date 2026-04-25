## 1. Claude版スキル実装

- [x] 1.1 `src/templates/claude/spec/note.md` を新規作成する
- [x] 1.2 テーブルID指定ありの場合の動作フロー（spec存在確認 → テキスト解析 → セクション判断 → プレビュー → 確認 → 書き込み）を記述する
- [x] 1.3 テーブルID指定なしの場合の動作フロー（テキスト解析 → テーブル推定 → プレビュー → 確認 → 書き込み）を記述する
- [x] 1.4 spec が存在しない場合のエラーハンドリング（メッセージ表示 → 終了）を記述する
- [x] 1.5 テーブル推定ができない場合のエラーハンドリングを記述する
- [x] 1.6 確認プレビューのフォーマット（対象ファイル・セクション・内容）を定義する
- [x] 1.7 セクション判断ロジック（ルールテーブル）をスキルに記述する

## 2. Gemini版・Codex版への同期

- [x] 2.1 `src/templates/gemini/modscape-spec-note/SKILL.md` を作成する（Claude版に YAML frontmatter を追加し `@modscape-spec-note` コマンド参照に変換）
- [x] 2.2 `src/templates/codex/modscape-spec-note/SKILL.md` を作成する（Claude版に YAML frontmatter + `## COMMAND: /modscape:spec:note` セクションを追加）

## 3. help コマンドのコマンド一覧整理

- [x] 3.1 `src/templates/claude/spec/help.md` の "Other Commands" テーブルを以下の2グループに分割する
  - **ワークフロー補助**（`changes/<name>` が前提）: `status` / `review` / `amend` / `answer` / `validate` / `explain`
  - **スタンドアロン**（前提なし、いつでも使用可）: `generate` / `note` / `search` / `help`
- [x] 3.2 help.md の冒頭コマンドリスト（`/modscape:spec:help <topic>` の対象）に `note` と `generate` を追加する
- [x] 3.3 Gemini版・Codex版の help スキルが存在する場合は同様に更新する

## 4. ドキュメント更新

- [x] 4.1 `README.md` のスキル一覧に `/modscape:spec:note` を追記する
- [x] 4.2 `README.ja.md` のスキル一覧に `/modscape:spec:note` を追記する
- [x] 4.3 `CHANGELOG.md` に変更履歴を追記する
