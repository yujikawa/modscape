## Why

`modscape dev --spec <name>` と per-table spec の閲覧がいずれも `dev` コマンドに同居しており、責務が曖昧になっている。`modscape dev` は YAML ビジュアライザ専用コマンドとして整理し、spec 関連の操作は `modscape spec` サブコマンド体系に統一することで、CLIの責務を明確にする。また、現在の `modscape build` / `modscape dev` では per-table HTML spec を ContextPanel に埋め込もうとしており、静的ビルドでは iframe が 404 になるなどの問題が発生している。spec ファイルは専用の閲覧モードで扱うべきであり、YAML ビジュアライザへの埋め込みは適切ではない。

## What Changes

- **新規: `modscape spec` コマンド群** — spec 関連操作を統一する名前空間を追加する
  - `modscape spec dev <name>` — SDD 作業中変更のビューア（旧: `modscape dev --spec <name>`）**BREAKING**
  - `modscape spec open` — 恒久 spec（`.modscape/specs/`）の専用ブラウザをブラウザで起動する
  - `modscape spec build` — 恒久 spec ブラウザを静的 HTML として出力する
- **削除: `modscape dev --spec` フラグ** — `modscape spec dev <name>` に移行する **BREAKING**
- **削除: ContextPanel の Specs タブから HTML spec 表示** — tableSpecs の埋め込みと iframe レンダリングを除去し、MD テキストの `<pre>` 表示に戻す
- **削除: `modscape build` の tableSpecs 注入** — per-table spec の埋め込みを除去し、build.js を元の形に戻す

## Capabilities

### New Capabilities

- `spec-command`: `modscape spec` サブコマンド群（`dev` / `open` / `build`）の CLI 登録とルーティング
- `spec-open`: `modscape spec open` — `.modscape/specs/` をスキャンしてモデルスラグ／テーブル一覧を表示するブラウザ UI をサーブする dev server モード
- `spec-build`: `modscape spec build` — 恒久 spec ブラウザを静的 HTML（`dist/specs/`）として出力する

### Modified Capabilities

- `spec-dev-viewer`: `modscape dev --spec <name>` → `modscape spec dev <name>` へのコマンド移行
- `dev-server`: `--spec` フラグの除去（`modscape dev` はモデル YAML のみを対象とする）
- `per-table-spec-html`: ContextPanel の `TableSpecSection` から `specIsHtml` / iframe 分岐を除去し、MD の `<pre>` 表示のみに戻す。`/api/table-spec/` エンドポイントは `modscape spec open` サーバーに移管する
- `sdd-archive`: per-table spec の参照先が `modscape spec open` に変わることを記述に反映する
- `sdd-table-spec`: 同上

## Impact

- `src/index.js` — `spec` サブコマンド登録
- `src/spec.js` — `spec dev` ロジック（`dev.js` から `--spec` 部分を切り出し）
- `src/specs.js` — `spec open` / `spec build` ロジック（新規）
- `src/dev.js` — `--spec` フラグ削除、`/api/table-spec/` エンドポイント削除
- `src/build.js` — tableSpecs 注入コードを除去（元の形に戻す）
- `visualizer/src/components/ContextPanel.tsx` — `TableSpecSection` から iframe 分岐を除去
- `visualizer/src/store/useStore.ts` — `TableSpecEntry.specIsHtml` を除去
- `visualizer/src/types/schema.ts` — `TableSpecEntry` 型から `specIsHtml` を除去
- `visualizer-dist/` — ビルド成果物の更新
- `README.md` / `README.ja.md` — CLIリファレンス更新
