## 1. スキーマ・型定義

- [x] 1.1 `visualizer/src/types/schema.ts` に `QuestionEntry` / `QuestionsYaml` 型を追加する
- [x] 1.2 `visualizer/src/lib/parser.ts` に `parseQuestionsYaml` 関数を追加する
- [x] 1.3 `visualizer/src/store/useStore.ts` に `questionsData` ステートを追加し、`/api/questions` および build 注入データから読み込むよう設定する

## 2. CLI — init / dev / build / context

- [x] 2.1 `src/init.js` の `--sdd` ブロックに `_questions.yaml` 空テンプレート生成を追加する
- [x] 2.2 `src/dev.js` に `/api/questions` エンドポイントを追加する（`_questions.yaml` を読み込んで返す）
- [x] 2.3 `src/build.js` に `questionsData` の読み込みと `window.__MODSCAPE_DATA__` への注入を追加する
- [x] 2.4 `src/context.js` の `loadQuestionsYaml` を `_questions.yaml` ベースに変更し、`context export` 出力に含める

## 3. _context.yaml・_questions.yaml のマイグレーション

- [x] 3.1 `.modscape/specs/_context.yaml` から `questions` セクションを削除する
- [x] 3.2 `.modscape/specs/_questions.yaml` に既存 Q&A サンプルデータを移行する（`_context.yaml` の questions 3 件）

## 4. ContextPanel — Q&A タブのデータソース変更

- [x] 4.1 `visualizer/src/components/ContextPanel.tsx` の Q&A タブを `questionsData`（`_questions.yaml`）から読み込むよう変更する
- [x] 4.2 Q&A エントリに `table` フィールドバッジと `status` アイコンを追加する
- [x] 4.3 `_questions.yaml` が存在しない場合の空表示を実装する

## 5. SDD スキルテンプレートの更新

- [x] 5.1 `src/templates/claude/spec/requirements.md` の questions 書き込み先を `_questions.yaml` に変更する
- [x] 5.2 `src/templates/claude/spec/answer.md` の questions 読み書き対象を `_questions.yaml` に変更する
- [x] 5.3 `src/templates/claude/spec/archive.md` に `questions.md` → `_questions.yaml` マージ手順を追加する
- [x] 5.4 Gemini 版（`src/templates/gemini/`）を Claude 版と同期する
- [x] 5.5 Codex 版（`src/templates/codex/`）を Claude 版と同期する

## 6. ビルド・動作確認

- [x] 6.1 `npm run build-ui` を実行してビルドエラーがないことを確認する
- [x] 6.2 `modscape dev` で ContextPanel の Q&A タブに `_questions.yaml` のデータが表示されることを確認する
- [x] 6.3 `modscape context export` の出力に questions が含まれることを確認する
