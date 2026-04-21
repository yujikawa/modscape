## Why

SDD（Spec-Driven Development）ワークフローで生まれる暗黙知が、graph viewに押し込まれた断片的な形でしか参照できない。`_context.yaml`のスキーマ情報と暗黙知が混在し、per-tableのspec.mdやquestions.mdとも役割が曖昧になっている。これらを整理し、暗黙知を統合して参照・活用できる仕組みを作る。

## What Changes

- **`_context.yaml`のスキーマ再設計**: `tables.*`（last_change, has_spec, open_questions）を廃止。プロジェクト横断の暗黙知（`decisions` + `questions`）のみを保持するシンプルな構造に変更。`spec new`実行時に空テンプレートを自動生成。
- **`modscape context export` CLIコマンドの新設**: `_context.yaml` + 全テーブルの`spec.md` + `questions.md`を集約し、JSON/Markdownで出力するコマンド。AIへのコンテキスト入力として使用。
- **`context.html` knowledge pageの新設**: `modscape build`/`modscape dev`でアクセスできる独立したHTMLページ。decisions・questionsと各テーブルのspec.md・questions.mdを統合表示。
- **graph viewの整理**: DecisionsTab、Decisionsタブ、❓バッジ、contextData読み込みロジックを削除。graph viewはデータモデルの可視化に集中させる。

## Capabilities

### New Capabilities

- `context-yaml-schema`: `_context.yaml`のスキーマ定義と空テンプレート生成（`spec new`連携含む）
- `context-export-cli`: `modscape context export`コマンドによる全暗黙知の統合出力
- `context-knowledge-page`: `context.html`として配信されるknowledge page（build/dev対応）

### Modified Capabilities

（なし）

## Impact

- `src/templates/claude/spec/requirements.md`（spec newでの_context.yaml生成ステップ追加）
- `src/templates/claude/spec/archive.md`（_context.yaml更新ロジックの変更）
- `src/index.js`（`modscape context`コマンド登録）
- `visualizer/src/`（DecisionsTab削除、DetailPanel整理、contextData削除）
- `visualizer/src/types/schema.ts`（ContextYaml型の変更）
- `vite.config.ts`（マルチエントリー設定追加）
- `src/dev.js` / `src/build.js`（context.html配信対応）
