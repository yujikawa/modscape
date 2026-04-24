## ADDED Requirements

### Requirement: 任意のアーティファクトからspec.mdを一括生成する
スキル `/modscape:spec:generate` は、model.yaml・SQLファイル・Pythonファイルなどの実装アーティファクトを読み込み、各テーブルに対して `.modscape/specs/<table-id>/spec.md` を生成しなければならない（SHALL）。テーブルIDは物理テーブル名とする。ユーザーが別IDを明示した場合はそちらを優先する。

#### Scenario: model.yamlを引数として実行する
- **WHEN** ユーザーが `/modscape:spec:generate model.yaml` を実行する
- **THEN** model.yaml内の全テーブルに対してspec.mdが生成される

#### Scenario: SQLファイルを引数として実行する
- **WHEN** ユーザーが `/modscape:spec:generate models/staging/*.sql` を実行する
- **THEN** 各SQLファイルからCREATE TABLEまたはSELECTのテーブル名・カラムを解析し、spec.mdが生成される

#### Scenario: 複数種のファイルを混在させて実行する
- **WHEN** ユーザーが `/modscape:spec:generate model.yaml models/staging/*.sql src/models.py` を実行する
- **THEN** 全ファイルを読み込み、発見した全テーブルのspec.mdが生成される

### Requirement: 引数なしの場合は対話でインプットを収集する
引数なしで呼び出された場合、スキルはユーザーに「参照するファイルまたはディレクトリを指定してください」と問い、入力されたパスをインプットとして使用しなければならない（SHALL）。

#### Scenario: 引数なしで実行する
- **WHEN** ユーザーが `/modscape:spec:generate` を引数なしで実行する
- **THEN** スキルはファイル・ディレクトリの指定を対話形式で収集し、その後通常の生成フローに進む

### Requirement: 実行開始時にmodel.yaml更新の要否を確認する
インプット収集の直後・ファイル解析の前に、スキルはユーザーに「model.yamlも更新しますか？」と確認しなければならない（SHALL）。ユーザーが不要と回答した場合は、spec.mdの生成のみを行う。

#### Scenario: model.yaml更新が不要な場合
- **WHEN** ユーザーがmodel.yaml更新不要と回答する
- **THEN** スキルはspec.mdの生成のみを行い、model.yamlには一切書き込まない

#### Scenario: model.yaml更新が必要な場合
- **WHEN** ユーザーがmodel.yaml更新を希望する
- **THEN** スキルはspec.mdの生成に加え、model.yamlにテーブル定義を追加・更新する

### Requirement: 既存のspec.mdはスキップする
対象テーブルの `.modscape/specs/<table-id>/spec.md` が既に存在する場合、スキルはそのファイルをスキップし上書きしてはならない（SHALL NOT）。

#### Scenario: spec.mdが既存のテーブルをスキップする
- **WHEN** `.modscape/specs/fct_orders/spec.md` が既に存在する状態で生成を実行する
- **THEN** `fct_orders` のspec.mdは生成されず、最終サマリーに「スキップ」として表示される

### Requirement: 生成結果のサマリーを表示する
スキルは全テーブルの処理完了後に、生成・スキップの結果一覧を表示しなければならない（SHALL）。

#### Scenario: 生成完了後のサマリー表示
- **WHEN** 全テーブルのspec.mdが生成または判定される
- **THEN** 「生成: N件、スキップ: M件」と各テーブル名を一覧表示する
