## 1. per-table spec 用 HTML テンプレートの作成

- [x] 1.1 `src/templates/spec/html/table-spec-template.html` を新規作成する（テーブル ID・grain・ビジネスルール・依存関係・Changelog セクションを含む自己完結型 HTML）

## 2. archive スキルの更新（archive.md）

- [x] 2.1 `src/templates/claude/spec/archive.md` の "always Markdown" 記述を削除し、`output_format: html` 時に `spec.html` を生成する分岐を追加する
- [x] 2.2 per-table spec の書き込み先を `SPEC_DIR/<model-slug>/<table-id>.html`（html）または `SPEC_DIR/<model-slug>/<table-id>.md`（md）のフラットファイル方式に変更する
- [x] 2.3 questions の書き込み先を `SPEC_DIR/<model-slug>/<table-id>.questions.md` に変更する
- [x] 2.4 model-slug 導出ロジックを追加する（`spec-config.yaml` の `main_yamls` から `path.parse().name`、グリーンフィールド時は出力パスから導出）
- [x] 2.5 旧フォルダ形式（`specs/<table-id>/spec.md`）の検出と手動移動案内のステップを追加する
- [x] 2.6 archive サマリー出力の spec パス表記を新形式（`specs/<model-slug>/<table-id>.html`）に更新する

## 3. dev.js の更新

- [x] 3.1 `/api/context/tables` に `?model=<slug>` クエリパラメータを追加し、`specs/<slug>/` 配下をフラットスキャンするよう変更する
- [x] 3.2 スキャンロジックを更新する：`<table-id>.html` → `specIsHtml: true`、`<table-id>.md` → `specIsHtml: false`、`<table-id>.questions.md` → `questions` フィールド
- [x] 3.3 `spec.html` を `spec.md` より優先するフォールバック設計を実装する
- [x] 3.4 `?model` 未指定時は `specs/` 直下をスキャンし従来の動作を維持する
- [x] 3.5 `/api/table-spec/:modelSlug/:tableId` エンドポイントを追加し、`specs/<modelSlug>/<tableId>.html` を `text/html` で配信する（`?theme=light` 時に LIGHT_MODE_CSS を注入）

## 4. フロントエンドの更新

- [x] 4.1 `visualizer/src/types/schema.ts` の `TableSpecEntry` に `specIsHtml?: boolean` を追加する
- [x] 4.2 `visualizer/src/store/useStore.ts` の `tableSpecs` 取得処理に `?model=<slug>` を付与するよう更新する（アクティブモデルスラグを渡す）
- [x] 4.3 `visualizer/src/components/ContextPanel.tsx` の `TableSpecSection` に `specIsHtml` 分岐を追加する（`true` のとき `<iframe src="/api/table-spec/...">` で表示）

## 5. ビルドと動作確認

- [x] 5.1 `npm run build-ui` が成功することを確認する
- [x] 5.2 サンプルの `.modscape/specs/<model-slug>/` にテスト用 `spec.html` と `spec.md` を配置し、ContextPanel で iframe / pre の切り替えが正しく動作することを手動確認する
- [x] 5.3 UI変更があるため `npm run test:update` でスナップショットを更新してコミットする
