## 1. スキルファイルへのoutput_format分岐追加

- [x] 1.1 `src/templates/claude/spec/requirements.md` に `output_format: html` 検出ブロックと HTML 出力指示を追加する
- [x] 1.2 `src/templates/claude/spec/design.md` に `output_format: html` 検出ブロックと HTML 出力指示（SVG lineage図含む）を追加する
- [x] 1.3 `src/templates/claude/spec/tasks.md` に `output_format: html` 検出ブロックと HTML 出力指示（進捗バー・チェックリスト）を追加する
- [x] 1.4 `src/templates/claude/spec/answer.md` / `amend.md` / `note.md` / `check.md` の各スキルに `output_format` 分岐を追加する
- [x] 1.5 各スキルの「ファイルパス参照箇所」（既存ファイルの読み込み・更新）が `.html` 拡張子を使うよう修正する

## 2. HTMLテンプレートファイルの作成

- [x] 2.1 `src/templates/spec/html/spec-template.html` を作成する（仕様書テンプレート）
- [x] 2.2 `src/templates/spec/html/design-template.html` を作成する（設計書テンプレート：SVG lineage図・テーブルカード含む）
- [x] 2.3 `src/templates/spec/html/tasks-template.html` を作成する（タスクリストテンプレート：進捗バー・チェックリスト含む）
- [x] 2.4 `src/templates/spec/html/questions-template.html` を作成する（Q&Aテンプレート）

## 3. modscape init の --html フラグ追加

- [x] 3.1 `src/init.js` に `--html` オプションを追加する（Commander の option 定義）
- [x] 3.2 `--html` 指定時に `src/templates/spec/html/*.html` を `.modscape/spec-templates/` にコピーする処理を実装する
- [x] 3.3 `--html` 指定時に `.modscape/modscape-spec.custom.md` へ `output_format: html` を追記する処理を実装する
- [x] 3.4 既存ファイルへの追記時に重複しないよう、既存内容チェックを追加する

## 4. dev.js の --spec モード追加

- [x] 4.1 `src/index.js` の `dev` コマンド定義に `--spec <name>` オプションを追加する
- [x] 4.2 `src/dev.js` の `startDevServer` 関数に `specName` 引数を追加し、specモード判定ロジックを実装する
- [x] 4.3 specモード時に `.modscape/changes/<name>/` の存在チェックとエラーハンドリングを追加する
- [x] 4.4 specモード時に `spec-model.yaml` を読み込む処理を追加する（`scanFiles` をバイパスして直接指定）
- [x] 4.5 `/api/spec/:file` エンドポイントを追加し、`.modscape/changes/<name>/*.html` を配信する
- [x] 4.6 `/api/spec/tabs` エンドポイントを追加し、存在するHTMLファイルのタブ情報（spec/design/tasks/questions）をJSON返却する
- [x] 4.7 chokidar の監視対象に `.modscape/changes/<name>/*.html` を追加し、変更時に `spec-update` イベントをブロードキャストする
- [x] 4.8 フロントに `MODSCAPE_SPEC_MODE=true` と `MODSCAPE_SPEC_NAME=<name>` を `index.html` 経由で注入する

## 5. Reactビジュアライザのspecモード対応

- [x] 5.1 `visualizer/src/components/SpecPanel.tsx` を新規作成する（タブ付きiframeビューア）
- [x] 5.2 `SpecPanel` に `/api/spec/tabs` を呼び出してタブ一覧を取得し、存在しないタブをdisabledにするロジックを実装する
- [x] 5.3 `SpecPanel` にWebSocket経由の `spec-update` イベントを受信してiframeをリロードする処理を追加する
- [x] 5.4 `visualizer/src/App.tsx` に `window.MODSCAPE_SPEC_MODE` の検出ロジックを追加する
- [x] 5.5 `App.tsx` のspecモード時のレイアウトを実装する（左ペイン: CytoscapeCanvas、右ペイン: SpecPanel、split比率50:50）

## 6. ビルドと動作確認

- [x] 6.1 `npm run build-ui` が成功することを確認する
- [ ] 6.2 サンプルspec（`.modscape/changes/` 配下）を用意して `modscape dev --spec <name>` の動作をE2Eで確認する
- [x] 6.3 UI変更があるため `npm run test:update` でスナップショットを更新してコミットする
