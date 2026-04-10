## 1. CLIコマンド: spec new に questions.md 生成を追加

- [x] 1.1 `src/index.js` の `spec new` コマンドで空の `questions.md` を生成する処理を追加する
- [x] 1.2 既存の `questions.md` が存在する場合は上書きしないガードを追加する

## 2. CLIコマンド: modscape spec answer

- [x] 2.1 `src/operations/questions.js` を新規作成し、`answerQuestion(filePath, id, answer)` を実装する（IDで検索し `[x]` に更新・`**A:**` を追記）
- [x] 2.2 `src/index.js` に `modscape spec answer <id> "<回答>" [--change <name>]` コマンドを登録する
- [x] 2.3 アクティブなchangeが1つの場合にchange名省略を許容する処理を実装する
- [x] 2.4 複数のアクティブchangeがある場合にchange名必須エラーを返す処理を実装する
- [x] 2.5 存在しないIDを指定した場合のエラー処理を実装する

## 3. スキルファイル: requirements フェーズへの questions.md 追記ルール追加

- [x] 3.1 `src/templates/claude/spec/requirements.md` に「要件収集中に不明な事項を questions.md に積む」ルールと書式を追記する
- [x] 3.2 Gemini版 (`src/templates/gemini/modscape-spec-requirements/SKILL.md`) に同期する
- [x] 3.3 Codex版 (`src/templates/codex/modscape-spec-requirements/SKILL.md`) に同期する

## 4. スキルファイル: design フェーズへの questions.md 追記ルール追加

- [x] 4.1 `src/templates/claude/spec/design.md` に「設計中に不明な事項を questions.md に積む」ルールと書式を追記する
- [x] 4.2 未解決質問がある場合の「進みますか？」確認フローを追記する
- [x] 4.3 Gemini版 (`src/templates/gemini/modscape-spec-design/SKILL.md`) に同期する
- [x] 4.4 Codex版 (`src/templates/codex/modscape-spec-design/SKILL.md`) に同期する

## 5. スキルファイル: implement フェーズへの questions.md 追記ルール追加

- [x] 5.1 `src/templates/claude/spec/implement.md` に「実装中に不明な事項を questions.md に積む」ルールを追記する
- [x] 5.2 Gemini版 (`src/templates/gemini/modscape-spec-implement/SKILL.md`) に同期する
- [x] 5.3 Codex版 (`src/templates/codex/modscape-spec-implement/SKILL.md`) に同期する

## 6. スキルファイル: archive フェーズへの questions.md sync 処理追加

- [x] 6.1 `src/templates/claude/spec/archive.md` に `questions.md` → `specs/questions.md` フラットマージ sync の手順を追記する（フォーマット・矛盾検知ルール含む）
- [x] 6.2 Gemini版 (`src/templates/gemini/modscape-spec-archive/SKILL.md`) に同期する
- [x] 6.3 Codex版 (`src/templates/codex/modscape-spec-archive/SKILL.md`) に同期する
