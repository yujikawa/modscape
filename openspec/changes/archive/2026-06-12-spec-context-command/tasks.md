## 1. CLIコマンドの実装（src/specs.js + src/index.js）

- [x] 1.1 `src/specs.js` に `runContextGet(ids, opts)` 関数を追加する（`loadContext`・`loadGlossary`・`loadQuestions` を活用）
- [x] 1.2 `decisions` フィルター: `ids` に指定IDを含むエントリ OR `scope: global` のエントリを抽出するロジックを実装する
- [x] 1.3 `questions` フィルター: `ids` に指定IDを含み、かつ `status: answered` または `status: assumed` のエントリのみを抽出するロジックを実装する
- [x] 1.4 `terms` フィルター: `ids` に指定IDを含むエントリ、または `ids` が空のエントリを抽出するロジックを実装する
- [x] 1.5 `--json` フラグ時の出力: `for_ids`・`decisions`・`rules`・`terms` 構造でJSON出力し、`change`・`date` プロベナンスフィールドを除外する
- [x] 1.6 テキスト出力（`--json` なし）: セクション別に人間可読な形式で出力する
- [x] 1.7 `src/index.js` に `modscape spec context --ids <ids> [--json]` コマンドを `specCommand` の下に登録する

## 2. 既存YAMLエントリの補完

- [x] 2.1 `.modscape/specs/_context.yaml` の D-001〜D-004 に `ids` または `scope: global` を追加する
- [x] 2.2 `.modscape/specs/_questions.yaml` の Q-003（タイムゾーン）に `scope: global` を追加する

## 3. アーカイブスキルのキュレーション基準追加（3プラットフォーム）

- [x] 3.1 `src/templates/claude/spec/archive.md` の Step 4（questions）・Step 4.5（glossary）・Step 5（context）にキュレーション基準（収録する / 収録しない / ids 必須化）を追記する
- [x] 3.2 `src/templates/codex/modscape-spec-archive/SKILL.md` に 3.1 と同内容を適用する
- [x] 3.3 `src/templates/gemini/modscape-spec-archive/SKILL.md` に 3.1 と同内容を適用する

## 4. codegenスキルの知識取得ステップ変更（Claudeテンプレート）

- [x] 4.1 `src/templates/claude/codegen.md` の Step 3（SDD context 読み込み）を `modscape spec context --ids` 使用に変更する
- [x] 4.2 `src/templates/claude/spec/implement.md` の各タスク処理前ステップに `modscape spec context --ids <table-id> --json` の実行指示を追加する

## 5. codegenスキルの知識取得ステップ変更（codex / geminiテンプレート）

- [x] 5.1 `src/templates/codex/modscape-spec-implement/SKILL.md` に 4.2 と同内容を適用する
- [x] 5.2 `src/templates/gemini/modscape-spec-implement/SKILL.md` に 4.2 と同内容を適用する

## 6. 動作確認

- [x] 6.1 `modscape spec context --ids fct_orders --json` を実行し、`_questions.yaml` / `_context.yaml` / `_glossary.yaml` から正しいエントリが返ることを確認する
- [x] 6.2 存在しないIDを指定した場合に空の結果が返ることを確認する
- [x] 6.3 `.modscape/specs/` が存在しないプロジェクトでエラーにならないことを確認する
