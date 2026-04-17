## Why

SDD ワークフローで蓄積された業務文脈（設計決定・Q&A・変更履歴）が `changes/archive/` にしか残らず、AI エージェントやビジュアライザーからアクセスしにくい。恒久的な知識をテーブル単位で構造化し、AI エージェントのコンテキストレイヤーおよびビジュアライザーの参照元として活用できるようにする。

## What Changes

- `.modscape/specs/` の構造をテーブル単位ディレクトリに再編する
  - `specs/_context.yaml` — テーブル横断の SDD メタデータ（last_change・open_questions・decisions）
  - `specs/<table-id>/spec.md` — テーブルの業務文脈・設計決定
  - `specs/<table-id>/questions.md` — テーブル単位の Q&A 履歴
- 現行の `specs/questions.md`（全テーブル混在フラット）を廃止し、テーブル単位の `questions.md` に移行
- `/modscape:spec:archive` スキル（Claude / Gemini / Codex）が上記構造に書き込むよう更新
- ビジュアライザーが `_context.yaml` を参照し、テーブルカードや詳細パネルに SDD メタデータを表示

## Capabilities

### New Capabilities
- `sdd-context-layer`: `.modscape/specs/` をテーブル単位に構造化し、AI エージェントとビジュアライザーのコンテキスト源として機能させる能力

### Modified Capabilities
- `sdd-archive`: archive 時の `specs/` への書き込みロジックをテーブル単位ディレクトリ構造に対応させる
- `sdd-questions`: `specs/questions.md` フラットファイルを廃止し `specs/<table-id>/questions.md` へ移行

## Impact

- `src/templates/claude/spec/archive.md` — specs 書き込みロジックの変更
- `src/templates/gemini/modscape-spec-archive/SKILL.md` — 同上
- `src/templates/codex/modscape-spec-archive/SKILL.md` — 同上
- `visualizer/src/` — `_context.yaml` 読み込みと UI 表示（テーブルカードバッジ・詳細パネル・Decisions タブ）
- `src/init.js` — SDD 初期化時に `specs/` 構造のスキャフォルドを追加
