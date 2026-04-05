## Why

modscape はデータモデルの設計・可視化に強みを持つが、「ビジネス要件からモデル設計に至る流れ」と「設計からタスク分解・実装に至る流れ」は整備されていない。kiro・spec-kit のような仕様駆動開発（SDD）の考え方をデータエンジニアリングに適用し、modscape を「モデルを書くツール」から「パイプライン構築全体を支援するフレームワーク」へ進化させる。

## What Changes

- `modscape init --claude --sdd` フラグを追加し、SDD用AIスキルをオプトインで生成できるようにする
- `.modscape/claude/sdd/` 配下に4つのAIスキル（スラッシュコマンド）を追加する
  - `/modscape:sdd:requirements` — ビジネス要件を対話的に収集し `spec.md` を生成
  - `/modscape:sdd:design` — `spec.md` をもとに `model.yaml` を提案・更新
  - `/modscape:sdd:tasks` — `model.yaml` のlineageから依存順にタスクを生成
  - `/modscape:sdd:implement` — `tasks.md` の未完了タスクを順に実装
- プロジェクト独自のルールを上書きできる `.modscape/sdd/sdd.custom.md` をサポートする
- 各スキルは次のスキルへの導線をメッセージで案内し、ユーザーが迷わないよう誘導する

## Capabilities

### New Capabilities

- `sdd-requirements`: ビジネス要件を対話的に定義し `spec.md` として出力するAIスキル
- `sdd-design`: `spec.md` を読み込み、mutation CLIを活用して `model.yaml` を設計するAIスキル
- `sdd-tasks`: `model.yaml` のlineage依存順を解析し `tasks.md` を生成するAIスキル
- `sdd-implement`: `tasks.md` を順に実装し、チェックボックスを更新するAIスキル
- `sdd-custom`: `.modscape/sdd/sdd.custom.md` によるプロジェクト固有ルールの上書き機能

### Modified Capabilities

- `cli-integration`: `modscape init` に `--sdd` フラグを追加（既存の `--claude` フラグとの組み合わせで動作）

## Impact

- `src/init.js` — `--sdd` フラグと、sdd スキルファイルの生成処理を追加
- `src/templates/claude/sdd/` — 4つのスキルファイルを新規追加
- `src/templates/claude/sdd/sdd.custom.md.example` — カスタマイズ例ファイルを追加
- `README.md` / `README.ja.md` — SDD ワークフローのセクションを追加
- `CHANGELOG.md` — エントリ追加
