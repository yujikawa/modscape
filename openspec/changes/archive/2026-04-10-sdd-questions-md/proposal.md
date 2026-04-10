## Why

SDDのrequirements・design・implementフェーズで、AIが自律的に判断できず人間の調査・確認が必要な事項が発生する。現状これらは会話の流れで消えてしまい、「誰が・何を・いつまでに確認すべきか」が管理されない。`questions.md` を導入することで、調査タスクを明示的に追跡・永続化し、設計品質を高める。

## What Changes

- `modscape spec new <name>` で `.modscape/changes/<name>/questions.md` を空ファイルとして生成する
- `requirements` / `design` / `implement` の各フェーズで、AIが人間の調査なしに判断できない事項を `questions.md` に随時追記する
- 未解決の質問があってもユーザーが「進んでいい」と指示した場合は仮定を明示して続行し、その仮定を質問に記録する
- 質問にはchange内でユニークなID（`Q-001` 形式）を採番する
- `/modscape:spec:answer [<name>] <id> "<回答>"` コマンドで質問に回答できる（アクティブなchangeが1つの場合はname省略可）
- `archive` 時に `.modscape/specs/questions.md` へテーブル単位フラットマージでsyncする
- sync時に既存質問との矛盾・廃止があればAIがコメントを付けて記録する

## Capabilities

### New Capabilities
- `sdd-questions`: SDDワークフロー全体を通じたQ&A管理機能（`questions.md` の生成・更新・回答・archive sync）

### Modified Capabilities
- `sdd-requirements`: requirementsフェーズで調査必要事項を `questions.md` に積む動作を追加
- `sdd-design`: designフェーズで調査必要事項を `questions.md` に積む動作を追加
- `sdd-implement`: implementフェーズで調査必要事項を `questions.md` に積む動作を追加
- `sdd-archive`: archiveフェーズで `.modscape/specs/questions.md` へのsync処理を追加

## Impact

- `src/templates/claude/spec/requirements.md` — questions.md への追記ルール追加
- `src/templates/claude/spec/design.md` — questions.md への追記ルール追加
- `src/templates/claude/spec/implement.md` — questions.md への追記ルール追加
- `src/templates/claude/spec/archive.md` — questions.md sync処理追加
- `src/index.js` — `modscape spec answer` コマンド追加
- `src/operations/questions.js` — Q&A操作ロジック（新規）
- Gemini / Codex版スキルにも同期が必要（Claude版が正）
