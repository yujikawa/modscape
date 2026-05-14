## MODIFIED Requirements

### Requirement: 任意のアーティファクトからspec.mdを一括生成する
スキル `/modscape:spec:generate` は、model.yaml・SQLファイル・Pythonファイルなどの実装アーティファクトを読み込み、各テーブルに対して `.modscape/specs/<table-id>/spec.md` を生成しなければならない（SHALL）。テーブルIDは物理テーブル名とする。ユーザーが別IDを明示した場合はそちらを優先する。

出力形式は常に `.md` とする（HTMLモード廃止のため `output_format` による切り替えは行わない）。

#### Scenario: model.yamlを引数として実行する
- **WHEN** ユーザーが `/modscape:spec:generate model.yaml` を実行する
- **THEN** model.yaml内の全テーブルに対して `.modscape/specs/<table-id>/spec.md` が生成される

#### Scenario: SQLファイルを引数として実行する
- **WHEN** ユーザーが `/modscape:spec:generate models/staging/*.sql` を実行する
- **THEN** 各SQLファイルからCREATE TABLEまたはSELECTのテーブル名・カラムを解析し、spec.mdが生成される

#### Scenario: 既存のspec.mdはスキップする
- **WHEN** `.modscape/specs/fct_orders/spec.md` が既に存在する状態で生成を実行する
- **THEN** `fct_orders` のspec.mdは生成されず、最終サマリーに「スキップ」として表示される
