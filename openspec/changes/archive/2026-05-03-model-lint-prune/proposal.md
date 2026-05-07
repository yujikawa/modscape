## Why

`modscape validate` はYAMLの構造的整合性（参照切れ・座標配置ミス等）を検証するが、モデルの**ドキュメント品質**や**モデリングベストプラクティスへの準拠**は検査しない。また、モデルを長期運用していくと孤立テーブルや参照切れエントリが蓄積されるが、これを検出・除去するコマンドが存在しない。`modscape lint` と `modscape prune` を追加することで、CI/CDゲートとしての品質保証と、モデルの継続的なメンテナンスを支援する。

## What Changes

- **`modscape lint <file>`** — ドキュメント品質・モデリングルールを設定ファイルに基づいて検査するコマンドを追加する
  - `.modscape/lint-rules.yaml` でルールをESLintスタイル（error / warn / off + オプション）で設定可能
  - 設定ファイルなしでもデフォルトルールセットで動作する
  - `--json` オプションでCI/CDに組み込み可能
  - `--rules <path>` でカスタムルールファイルを指定可能
- **`modscape prune <file>`** — 孤立エントリ・参照切れを検出し、`--write` フラグで実際に削除するコマンドを追加する
  - デフォルトはdry-run（削除対象の一覧表示のみ）
  - `--write` を指定したときのみYAMLを上書き保存
  - `--json` オプション対応
- `src/index.js` に両コマンドを登録する
- `README.md` / `README.ja.md` にコマンドリファレンスを追記する
- `src/templates/rules.md` のSection 12に両コマンドのフラグを追記する
- `CHANGELOG.md` にエントリを追加する

## Capabilities

### New Capabilities

- `cli-lint`: `modscape lint` コマンド。設定ベースのドキュメント品質・モデリングルール検査。ルールはerror/warn/offのseverity＋条件オプションで設定可能。
- `cli-prune`: `modscape prune` コマンド。孤立テーブル・参照切れrelationship/lineage/layoutエントリの検出と削除。dry-runがデフォルトで`--write`で実際に書き込む。

### Modified Capabilities

（なし）

## Impact

- **新規ファイル**: `src/lint.js`、`src/prune.js`
- **変更ファイル**: `src/index.js`（コマンド登録）、`README.md`、`README.ja.md`、`src/templates/rules.md`、`CHANGELOG.md`
- **依存追加**: なし（既存の `model-utils.js` の `readYaml` / `resolveImports` を再利用）
- **破壊的変更**: なし
