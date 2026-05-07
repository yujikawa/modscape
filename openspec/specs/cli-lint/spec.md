## ADDED Requirements

### Requirement: lintコマンド
システムは `modscape lint <file>` コマンドを提供しなければならない（SHALL）。モデルYAMLのドキュメント品質・モデリングベストプラクティスへの準拠を検査し、error/warnを報告する。

#### Scenario: エラーがないモデルをlintする
- **WHEN** `modscape lint model.yaml` をルール違反のないファイルに対して実行する
- **THEN** 「No issues found.」と表示され終了コード0で終了する

#### Scenario: エラーがあるモデルをlintする
- **WHEN** ルール違反のあるファイルに対して実行する
- **THEN** 違反内容（テーブルID・ルール名・メッセージ）が一覧表示され、errorが1件以上あれば終了コード1で終了する

#### Scenario: warningのみのモデルをlintする
- **WHEN** errorは0件、warningが1件以上あるファイルに対して実行する
- **THEN** warning内容が一覧表示され、終了コード0で終了する

#### Scenario: --jsonオプションで構造化出力する
- **WHEN** `modscape lint model.yaml --json` を実行する
- **THEN** `{ "valid": bool, "errors": [...], "warnings": [...] }` 形式のJSONが出力される

#### Scenario: --rulesオプションでカスタムルールファイルを指定する
- **WHEN** `modscape lint model.yaml --rules .modscape/my-rules.yaml` を実行する
- **THEN** 指定したルールファイルの設定でlintが実行される

### Requirement: デフォルトルールセット
設定ファイルが存在しない場合、システムはデフォルトルールセットで動作しなければならない（SHALL）。デフォルトでは全ルールが `warn` として適用される。

#### Scenario: 設定ファイルなしで実行する
- **WHEN** `.modscape/lint-rules.yaml` が存在しない状態で `modscape lint model.yaml` を実行する
- **THEN** デフォルトルールセット（全ルールwarn）で検査が実行される

### Requirement: lint-rules.yaml 設定ファイル
システムは `.modscape/lint-rules.yaml` を設定ファイルとして読み込まなければならない（SHALL）。各ルールは `severity: error | warn | off` と追加オプションで設定可能である。

#### Scenario: ルールをoffに設定する
- **WHEN** `lint-rules.yaml` で `require-description: { severity: off }` と設定する
- **THEN** そのルールの違反は報告されない

#### Scenario: kindsオプションで対象kindを絞る
- **WHEN** `require-physical-name: { severity: error, kinds: [fact, mart] }` と設定する
- **THEN** `conceptual.kind` が `fact` または `mart` のテーブルのみが対象になる

### Requirement: require-descriptionルール
テーブルまたはカラムの `description` フィールドが未定義の場合に報告するルールを提供しなければならない（SHALL）。

#### Scenario: テーブルのdescriptionが未定義
- **WHEN** `require-description: { severity: error, target: tables }` が設定されており、あるテーブルに `conceptual.description` がない
- **THEN** そのテーブルIDとルール名がerrorとして報告される

#### Scenario: カラムのdescriptionが未定義
- **WHEN** `require-description: { severity: warn, target: columns }` が設定されており、あるカラムに `description` がない
- **THEN** そのテーブルID・カラムIDとルール名がwarningとして報告される

### Requirement: require-primary-keyルール
テーブルに `isPrimaryKey: true` のカラムが1つも定義されていない場合に報告するルールを提供しなければならない（SHALL）。

#### Scenario: PKカラムが存在しない
- **WHEN** `require-primary-key: { severity: error }` が設定されており、あるテーブルのカラムに `isPrimaryKey: true` が1つもない
- **THEN** そのテーブルIDとルール名がerrorとして報告される

### Requirement: require-physical-nameルール
テーブルの `physical.name` が未定義の場合に報告するルールを提供しなければならない（SHALL）。`kinds` オプションで対象kindを絞れる。

#### Scenario: physical.nameが未定義（kindフィルターあり）
- **WHEN** `require-physical-name: { severity: warn, kinds: [fact, mart] }` が設定されており、`kind: fact` のテーブルに `physical.name` がない
- **THEN** そのテーブルIDとルール名がwarningとして報告される

#### Scenario: kindフィルター外のテーブルはスキップされる
- **WHEN** `require-physical-name: { severity: warn, kinds: [fact] }` が設定されており、`kind: dimension` のテーブルに `physical.name` がない
- **THEN** そのテーブルは報告されない

### Requirement: require-column-typeルール
カラムの `type` フィールドが未定義の場合に報告するルールを提供しなければならない（SHALL）。

#### Scenario: カラムのtypeが未定義
- **WHEN** `require-column-type: { severity: warn }` が設定されており、あるカラムに `type` がない
- **THEN** そのテーブルID・カラムIDとルール名がwarningとして報告される

### Requirement: require-tagsルール
テーブルの `conceptual.tags` が未定義または空の場合に報告するルールを提供しなければならない（SHALL）。`kinds` オプションで対象kindを絞れる。

#### Scenario: BEAMタグが未定義（factテーブル）
- **WHEN** `require-tags: { severity: warn, kinds: [fact, mart] }` が設定されており、`kind: fact` のテーブルに `tags` がない
- **THEN** そのテーブルIDとルール名がwarningとして報告される

### Requirement: no-orphan-referencesルール
`relationships`・`lineage`・`domains.members`・`layout` が存在しないテーブルIDを参照している場合に報告するルールを提供しなければならない（SHALL）。

#### Scenario: relationshipが存在しないテーブルを参照する
- **WHEN** `no-orphan-references: { severity: error }` が設定されており、relationshipの `from.table` が存在しないIDを指している
- **THEN** そのrelationship IDとルール名がerrorとして報告される

### Requirement: incremental-requires-merge-keyルール
`physical.strategy: incremental` のテーブルに `merge_key` または `filter_key` が設定されていない場合に報告するルールを提供しなければならない（SHALL）。

#### Scenario: incrementalテーブルにmerge_keyもfilter_keyもない
- **WHEN** `incremental-requires-merge-key: { severity: error }` が設定されており、`strategy: incremental` のテーブルに `merge_key` も `filter_key` もない
- **THEN** そのテーブルIDとルール名がerrorとして報告される
