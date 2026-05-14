## Why

`output_format: html` モードで変更成果物（spec.html / design.html 等）は HTML 生成されるが、アーカイブで作られる per-table spec（`.modscape/specs/<table-id>/spec.md`）だけが "always Markdown" と明示されており、フォーマットが揃っていない。また、複数モデルが共存するプロジェクトでは specs ディレクトリのフラット構造によりテーブル ID が衝突する可能性がある。

## What Changes

- `output_format: html` のとき、archive スキルが per-table spec を `spec.html` で生成するようになる（md モードは現状維持）
- per-table spec の保存先ディレクトリ構造を `specs/<model-slug>/<table-id>/` 方式に変更し、複数モデルでのテーブル ID 衝突を解消する
- `dev.js` の `/api/context/tables` が `spec.html` を認識し、フロント側で iframe によるリッチ表示を行う
- 既存フラット構造（`specs/<table-id>/spec.md`）からのマイグレーションを archive 時に案内する

## Capabilities

### New Capabilities

- `per-table-spec-html`: per-table spec の HTML 出力対応と ContextPanel での iframe 表示

### Modified Capabilities

- `sdd-archive`: per-table spec の書き込み先を `specs/<model-slug>/<table-id>/` に変更し、html モード時に `spec.html` を生成するルールを追加
- `sdd-table-spec`: per-table spec が html/md 両フォーマットをサポートするよう要件を更新
- `dev-server`: `/api/context/tables` が `spec.html` を認識し `specIsHtml` フラグを返す動作を追加

## Impact

- `src/templates/claude/spec/archive.md` — per-table spec 生成ルール更新（html 分岐・モデルスラグ方式）
- `src/templates/spec/html/table-spec-template.html` — 新規追加（per-table 用 HTML テンプレート）
- `src/dev.js` — `/api/context/tables` の html 対応・モデルスラグスキャン、`/api/table-spec/:modelSlug/:tableId` エンドポイント追加
- `visualizer/src/components/ContextPanel.tsx` — `TableSpecSection` に iframe 分岐追加
- `visualizer/src/types/schema.ts` / `visualizer/src/store/useStore.ts` — `TableSpecEntry` 型更新
- `visualizer-dist/` — ビルド成果物の更新
