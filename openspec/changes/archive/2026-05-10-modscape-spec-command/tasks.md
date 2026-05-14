## 1. 既存コードの整理（削除・リバート）

- [x] 1.1 `src/build.js` から tableSpecs 注入コード（`loadTableSpecsForSlug` 関数・モデルループへの `tableSpecs` 追加・`injectionData` への注入）を除去し、元の形に戻す
- [x] 1.2 `src/dev.js` から `/api/table-spec/:modelSlug/:tableId` エンドポイントを削除する
- [x] 1.3 `visualizer/src/types/schema.ts` の `TableSpecEntry` から `specIsHtml?: boolean` を削除する
- [x] 1.4 `visualizer/src/store/useStore.ts` の `TableSpecEntry` import / 利用箇所から `specIsHtml` を削除する（`setCurrentModel` の `model?.tableSpecs` 参照も元に戻す）
- [x] 1.5 `visualizer/src/components/ContextPanel.tsx` から `TableSpecSection` の iframe 分岐・`LIGHT_MODE_CSS` 定数・`useEffect` / `useMemo` の blob URL ロジックを除去し、MD テキストの `<pre>` 表示のみに戻す

## 2. `modscape dev` から `--spec` フラグを削除する

- [x] 2.1 `src/index.js` の `dev` コマンド定義から `.option('--spec <name>', ...)` を削除する
- [x] 2.2 `src/dev.js` の `startDevServer()` から `specName` 引数と specMode ロジック全体（`if (specName) { ... }` ブロック）を削除する

## 3. `src/spec.js` を新規作成する（modscape spec dev）

- [x] 3.1 `src/spec.js` を新規作成し、`dev.js` から切り出した specMode ロジックを `startSpecDevServer(specName)` として実装する
  - `.modscape/changes/<name>/` の存在確認とエラー処理
  - spec-model.yaml のサーブ（`/api/files`, `/api/model`）
  - spec タブの HTML サーブ（`/api/spec/tabs`, `/api/spec/file/:filename`）
  - WebSocket によるライブリロード
  - ブラウザ自動オープン

## 4. `src/specs.js` を新規作成する（modscape spec open / build）

- [x] 4.1 `src/specs.js` を新規作成し、`.modscape/specs/` をスキャンする `scanSpecsDir()` ユーティリティを実装する（model-slug サブディレクトリ内の `.html` / `.md` ファイルを列挙）
- [x] 4.2 `modscape spec open` の実装: Express サーバーを起動し、`/`（ブラウザ UI HTML）・`/api/spec-index`・`/api/table-spec/:slug/:tableId`・`/api/table-spec-md/:slug/:tableId` エンドポイントを提供する。chokidar で `.modscape/specs/` を監視し WebSocket でライブリロードする
- [x] 4.3 `modscape spec open` のブラウザ UI HTML を実装する（左ペイン: model-slug 別テーブル一覧、右ペイン: iframe / pre 表示、vanilla JS で切り替え）
- [x] 4.4 `modscape spec build [outDir]` の実装: `scanSpecsDir()` でファイルを列挙し、`index.html`（静的ナビゲーション付き）と各 spec ファイルを出力ディレクトリにコピー・生成する

## 5. `src/index.js` にコマンドを登録する

- [x] 5.1 `src/index.js` に `modscape spec` 親コマンドを登録し、`dev <name>` / `open` / `build [outDir]` サブコマンドを追加する
- [x] 5.2 `spec.js` / `specs.js` を import して各サブコマンドのアクションに接続する

## 6. フロントエンドのビルドと動作確認

- [x] 6.1 `npm run build-ui` が成功することを確認する
- [x] 6.2 `modscape spec dev <name>` で SDD ビューアが起動することを確認する（`dev.js` 時と同等の動作）
- [x] 6.3 `modscape spec open` で spec ブラウザが起動し、HTML spec が iframe で表示されることを確認する
- [x] 6.4 `modscape spec build` で `dist/specs/` が生成されることを確認する

## 7. ドキュメント更新

- [x] 7.1 `README.md` / `README.ja.md` の CLI リファレンスを更新する（`modscape spec` コマンド群を追加、`modscape dev --spec` を削除）
- [x] 7.2 `CHANGELOG.md` に変更を記載する（`modscape spec` 追加、`modscape dev --spec` 廃止）
