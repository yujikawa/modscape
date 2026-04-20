## Why

現状、Q&Aの置き場所が `_context.yaml` の `questions` セクション（YAML）と `specs/<table>/questions.md`（Markdown）に分散しており、形式が混在している。さらにテーブル固有の質問がプロジェクト横断の回答になるケースも多く、テーブル単位とプロジェクト単位の境界線が曖昧。これを `_questions.yaml` に統合し、`table` フィールドで紐づける形に一本化する。`spec:archive` 時に `questions.md` の内容を `_questions.yaml` に自動マージすることで、アーカイブ後も Q&A が集約された状態を維持する。

## What Changes

- `.modscape/specs/_questions.yaml` を新設（全Q&Aの一元管理、`table` フィールドで紐づけ）
- `_context.yaml` から `questions` セクションを削除（decisions のみに）
- `modscape init --sdd` で `_questions.yaml` 空テンプレートを生成
- `spec:archive` スキルに `questions.md` → `_questions.yaml` マージロジックを追加
- SDD スキル（`spec:requirements`・`spec:answer`）の questions 書き込み先を `questions.md` → `_questions.yaml` に変更
- ContextPanel の Q&A タブを `_questions.yaml` から読み込むよう変更
- `modscape context export` の出力を `_questions.yaml` ベースに変更
- `specs/<table>/questions.md` は廃止（`spec:archive` でマージ済みのものは削除）

## Capabilities

### New Capabilities
- `questions-yaml-schema`: `_questions.yaml` のスキーマ設計（型定義・パーサー・テンプレート）
- `questions-sdd-integration`: SDD スキルへの `_questions.yaml` 書き込みフロー組み込み・archive マージ

### Modified Capabilities
- `context-yaml-schema`: `_context.yaml` から `questions` セクションを削除
- `glossary-ui`: ContextPanel の Q&A タブを `_questions.yaml` から読み込むよう変更
- `context-export-cli`: `modscape context export` を `_questions.yaml` ベースに変更

## Impact

- `visualizer/src/types/schema.ts` — `QuestionEntry`・`QuestionsYaml` 型追加、`ContextYaml` から `questions` 削除
- `visualizer/src/lib/parser.ts` — `parseQuestionsYaml` 追加
- `visualizer/src/store/useStore.ts` — `questionsData` ステート追加
- `visualizer/src/components/ContextPanel.tsx` — Q&A タブのデータソース変更
- `src/init.js` — `--sdd` 時に `_questions.yaml` 生成
- `src/context.js` — `_questions.yaml` から読み込むよう変更
- `src/dev.js` — `/api/questions` エンドポイント追加
- `src/build.js` — `questionsData` インジェクション追加
- `src/templates/claude/spec/requirements.md` — questions 書き込み先変更
- `src/templates/claude/spec/answer.md` — questions 書き込み先変更
- `src/templates/claude/spec/archive.md` — `questions.md` → `_questions.yaml` マージ追加
- Gemini・Codex 版スキルも同様に sync
