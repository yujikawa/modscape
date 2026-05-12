## Why

HTML版specの各テンプレートがダークモード固定の配色を持ち、ライトモード対応はspec.jsでのCSS注入という2重構造になっている。また、check / generate / note の3つのスキルがHTML modeを考慮しておらず、`output_format: html` 設定時に正しく動作しない。これらを修正してHTML版specの品質と一貫性を高める。

## What Changes

- **HTMLテンプレート全5枚のカラースキーム書き換え**: `background: #0f172a`（ダーク固定）をライトグレーベース（`#f8f9fa` / `#f1f5f9`）に統一する
- **spec.js の LIGHT_MODE_CSS 削除**: ダーク/ライト2系統が不要になるため、CSS注入コードを削除する
- **check.md（validateスキル）のHTML mode対応**: Markdown前提の3箇所のパース指示をHTMLクラス構造に対応させる
  - `- [ ]` パターン → `<div class="q-item open">` 系の構造
  - `**仮定:**` / `**Assumption:**` Markdown構文 → HTML内のデータ属性またはテキストパターン
  - AC Coverage の抽出指示をHTML構造に対応
- **generate.md の HTML mode 対応**: `output_format: html` 時に `table-spec-template.html` を使って `.html` ファイルを生成するよう修正
- **note.md の HTML mode 対応**: `output_format: html` 時に対象ファイルを `.html` として読み書きするよう修正

## Capabilities

### New Capabilities

なし

### Modified Capabilities

- `spec-dev-viewer`: spec dev viewerで表示されるHTMLのカラースキームをテーマ非依存のライトグレーベースに変更する
- `sdd-validate`: `/modscape:spec:check`（validateスキル）がHTML modeでも正しく整合性チェックできるよう要件を更新する
- `spec-generate-skill`: `/modscape:spec:generate` が `output_format: html` 時に `.html` ファイルを生成する要件を追加する
- `sdd-note`: `/modscape:spec:note` が `output_format: html` 時に `.html` ファイルを対象にする要件を追加する

## Impact

- `src/templates/spec/html/` 以下の全HTMLテンプレート（5ファイル）
- `src/spec.js`（LIGHT_MODE_CSS定数と注入処理）
- `src/templates/claude/spec/check.md`（validateスキル）
- `src/templates/claude/spec/generate.md`
- `src/templates/claude/spec/note.md`
- `openspec/specs/spec-dev-viewer/spec.md`（要件更新）
- `openspec/specs/sdd-validate/spec.md`（要件更新）
- `openspec/specs/spec-generate-skill/spec.md`（要件更新）
- `openspec/specs/sdd-note/spec.md`（要件更新）
