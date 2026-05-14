## Why

HTML出力モード（`output_format: html`）は、`modscape spec dev` でのきれいな表示を目的として導入された。しかし `marked` + `highlight.js` によるサーバーサイドの Markdown → HTML 変換を実装した結果、MDファイルが `spec dev` で十分にきれいに表示できることが判明した。

HTMLモードを維持することのデメリットが明確になった：
- AIスキルがHTMLを生成するためのトークンコストが大きい
- skill の MD/HTML dual-path ロジックが複雑でメンテナンスコストが高い
- HTML テンプレート5ファイルの管理が必要
- Gemini/Codex への sync 作業が都度発生する

唯一の優位点だった Questions フィルター機能も、サーバーサイドで `questions.md` をパースして生成できる。

## What Changes

- `src/templates/spec/html/` の HTML テンプレート5ファイルを削除
- 全 SDD skill（Claude/Gemini/Codex）から HTML mode 分岐ロジックを除去し、MD のみに統一
- `modscape init --html` フラグを削除
- `modscape-spec.config.yaml` の `output_format` キーを削除
- `src/spec.js` の `specNew()` から html 分岐を削除
- `src/init.js` の `--html` 処理を削除
- README / CHANGELOG の HTML mode 記述を更新

## Capabilities

### New Capabilities
- なし

### Modified Capabilities
- `spec-dev-viewer`: HTML モード廃止、MD のみに統一
- `sdd-validate`: HTML mode パースロジックを削除、MD のみに統一
- `spec-generate-skill`: HTML mode 生成ロジックを削除、MD のみに統一
- `sdd-note`: HTML mode 読み書きロジックを削除、MD のみに統一

## Impact

- `src/templates/spec/html/` ディレクトリ（5ファイル削除）
- `src/templates/claude/spec/` 以下の全 skill ファイル（11ファイル）
- `src/templates/gemini/` および `src/templates/codex/` の spec skill（各11ファイル）
- `src/init.js`、`src/spec.js`、`src/index.js`
- `.modscape/modscape-spec.config.yaml`（`output_format` キー不要に）
- `README.md`、`README.ja.md`、`CHANGELOG.md`
