## Why

modscape:spec スキルが生成する成果物（spec.md / design.md / tasks.md）はMarkdown形式だが、100行を超えると読みづらく、仕様・設計・グラフを確認するために複数ファイルとmodscape devを行き来する必要がある。HTMLに移行することでリッチな表現と統合ビューアを実現し、レビューループのコストを下げる。

## What Changes

- `modscape-spec.custom.md` に `output_format: html` を設定すると、各specスキルがMarkdownではなくHTMLファイルを生成するようになる
- `modscape init --html` フラグを追加し、`output_format: html` を `modscape-spec.custom.md` に自動追記する
- `modscape dev --spec <name>` コマンドを追加し、`.modscape/changes/<name>/` をspecモードで起動する
  - 左ペイン：`spec-model.yaml` の Cytoscapeグラフ（既存ビジュアライザを流用）
  - 右ペイン：`spec.html` / `design.html` / `tasks.html` / `questions.html` のタブビューア
  - ファイル変更を監視してライブリロード
- 各specスキル（requirements / design / tasks / questions / answer / amend 等）に `output_format` 分岐を追加する

## Capabilities

### New Capabilities

- `spec-html-output`: specスキルが `output_format: html` 設定に基づいてHTMLファイルを生成する機能
- `spec-dev-viewer`: `modscape dev --spec <name>` で起動するspecモードの統合ビューア（グラフ + HTMLタブ）

### Modified Capabilities

- `cli-init`: `--html` フラグを追加し、`modscape-spec.custom.md` に `output_format: html` を書き込む動作が追加される

## Impact

- `src/templates/claude/spec/*.md`（全スキルファイル）— `output_format` 分岐の追記
- `src/init.js` — `--html` フラグの追加
- `src/dev.js` — `--spec` オプションの追加、HTMLファイル配信APIとwatcherの追加
- `visualizer/src/App.tsx` — specモード検出とレイアウト切り替え
- `visualizer/src/components/SpecPanel.tsx` — 新規コンポーネント（タブ付きHTMLビューア）
- `visualizer-dist/` — ビルド成果物の更新が必要
