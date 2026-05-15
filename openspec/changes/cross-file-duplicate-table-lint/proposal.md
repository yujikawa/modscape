## Why

複数の model YAML ファイルに同一テーブル ID が重複定義された状態は、テーブルの「所有者」が曖昧になり、AIエージェントや開発者が修正対象を特定できず、SDDワークフローのarchive時にどのファイルへ戻すかが不定になる。正しい構造は「主たるファイルがテーブルを定義し、利用側は `imports:` で参照する」であり、この原則をlintで検知・誘導することで所有権の曖昧さを早期に検出できる。

## What Changes

- `modscape lint` にディレクトリ指定・複数ファイル指定を追加し、クロスファイルのテーブルID重複を検知する新ルール `no-duplicate-table-ids` を追加する
- `modscape extract` が同一テーブルIDを複数ファイルで発見した場合、last-winsで静かに上書きするのをやめ、警告を出力する

## Capabilities

### New Capabilities

- `cross-file-lint`: 複数 model YAML ファイルをまたいで同一テーブルIDの重複定義を検知する lint ルール（`no-duplicate-table-ids`）。ディレクトリ指定・複数ファイル指定に対応し、import で明示的に参照されていない重複を `warn` として報告する。

### Modified Capabilities

- `cli-lint`: `modscape lint` コマンドが複数ファイル・ディレクトリを入力として受け付けるよう、コマンドのインターフェースを拡張する。
- `cli-extract-command`: `modscape extract` が同一テーブルIDを複数ソースファイルで発見した際にサイレントな last-wins を行わず、`WARN` を出力するよう動作を変更する。

## Impact

- CLI コマンド: `modscape lint`（インターフェース変更）、`modscape extract`（警告出力追加）
- 既存の lint ルールセット（`lint-rules.yaml`）: 新ルール `no-duplicate-table-ids` がデフォルト `warn` で追加される
- AIエージェントのワークフロー: extract 前に lint を実行することで所有権の曖昧さを事前検知できるようになる
