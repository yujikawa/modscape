## Why

`/modscape:spec:design` と `/modscape:spec:implement` が1セッションで全テーブルを処理する設計のため、テーブル数に比例してコンテキストが累積し、トークン消費量が大きくなっている。この問題は Claude / Gemini / Codex など使用するAIエージェントによらず共通して発生する。

## What Changes

- **`/modscape:spec:design`**: 1回の呼び出しで「次の未設計テーブルを1つだけ設計して終了」する動作に変更する。ユーザーが繰り返し呼び出すことで全テーブルを処理するループ構造にする
- **`/modscape:spec:implement`**: 同様に1回の呼び出しで「次の未実装タスクを1つだけ実装して終了」する動作に変更する
- **`design.md` の責務分離**: テーブル非依存の情報のみ `design.md` に残し、テーブル固有の Implementation Details を `design/<table-id>.md` に分離する
- **`design.md` の SUMMARY ブロック**: `tasks` コマンドが全文読み込みを避けられるよう、冒頭に機械読み用の SUMMARY ブロックを追加する
- **`modscape spec new` の scaffold 更新**: `design/` サブディレクトリを初期 scaffold に追加する

## Capabilities

### New Capabilities

（なし）

### Modified Capabilities

- `sdd-design`: 1テーブル=1呼び出しモードへの変更、および `design/<table-id>.md` への Implementation Details 分離
- `sdd-implement`: 1テーブル=1呼び出しモードへの変更（design.md の読み取り対象ファイルの変更を含む）

## Impact

- `src/templates/claude/spec/design.md` — 1テーブル処理モード、`design/<table>.md` への書き出しルールを追記
- `src/templates/claude/spec/implement.md` — 1テーブル処理モード、`design/<table>.md` からの読み取りルールに変更
- `src/templates/claude/spec/tasks.md` — SUMMARY ブロック読み取りに変更
- `src/templates/gemini/modscape-spec-design` — 同上（Gemini テンプレート）
- `src/templates/gemini/modscape-spec-implement` — 同上（Gemini テンプレート）
- `src/templates/gemini/modscape-spec-tasks` — 同上（Gemini テンプレート）
- `src/templates/formats/design-format.md` — SUMMARY ブロックの追加、Implementation Details セクションの削除
- `src/specs.js` — `modscape spec new` の `design.md` 初期内容を新フォーマットに更新
- `src/spec.js` — `GET /api/spec/design-tables` と `GET /api/spec/design/:tableId` エンドポイントを追加
- `visualizer/src/components/SpecPanel.tsx` — Design タブにサブタブを追加（テーブルごとの実装詳細を切り替え可能）
