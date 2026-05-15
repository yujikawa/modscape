## MODIFIED Requirements

### Requirement: lintコマンド
システムは `modscape lint <file|dir> [<file|dir>...]` コマンドを提供しなければならない（SHALL）。引数として単一ファイル・複数ファイル・ディレクトリのいずれも受け付けなければならない（SHALL）。モデルYAMLのドキュメント品質・モデリングベストプラクティスへの準拠を検査し、error/warnを報告する。

#### Scenario: 単一ファイルをlintする（既存動作）
- **WHEN** `modscape lint model.yaml` をルール違反のないファイルに対して実行する
- **THEN** 「No issues found.」と表示され終了コード0で終了する

#### Scenario: 複数ファイルを指定してlintする
- **WHEN** `modscape lint main-model1.yaml main-model2.yaml` を実行する
- **THEN** 両ファイルに対して単一ファイルルールが適用され、さらにクロスファイルルール（`no-duplicate-table-ids` 等）が適用される

#### Scenario: ディレクトリを指定してlintする
- **WHEN** `modscape lint ./models/` を実行する
- **THEN** ディレクトリ内のすべての `.yaml` / `.yml` ファイルを対象に lint が実行される

#### Scenario: ディレクトリ内の非モデルYAMLは無視される
- **WHEN** `modscape lint ./models/` を実行し、ディレクトリ内に `version:` フィールドを持たないYAMLファイルが存在する
- **THEN** そのファイルはモデルYAMLとして扱われず、lint 対象からスキップされる

#### Scenario: エラーがあるモデルをlintする
- **WHEN** ルール違反のあるファイルに対して実行する
- **THEN** 違反内容（テーブルID・ルール名・メッセージ）が一覧表示され、errorが1件以上あれば終了コード1で終了する

#### Scenario: warningのみのモデルをlintする
- **WHEN** errorは0件、warningが1件以上あるファイルに対して実行する
- **THEN** warning内容が一覧表示され、終了コード0で終了する

#### Scenario: --jsonオプションで構造化出力する
- **WHEN** `modscape lint model.yaml --json` を実行する
- **THEN** `{ "valid": bool, "errors": [...], "warnings": [...] }` 形式のJSONが出力される
