## MODIFIED Requirements

### Requirement: _questions.yaml ファイルのスキーマ定義

`.modscape/specs/_questions.yaml` を Q&A の一元管理ファイルとして定義する。ファイルは `questions:` リストを持ち、各エントリは `id`・`question`・`status` フィールドを必須とし、`answer`・`assumption`・`ids`・`date`・`change` を任意とする。

`ids` フィールドはこのQ&Aが参照するエンティティID（テーブル・リレーション等）のリストとする。旧フィールド名 `table`（単数・テーブル限定）は廃止する。

#### Scenario: ids フィールドで任意エンティティを参照する
- **WHEN** `ids: [fct_orders]` を持つエントリが `_questions.yaml` に存在する
- **THEN** パーサーはそのエントリを有効な `QuestionEntry` として返す

#### Scenario: ids を省略した最小構成で質問を登録する
- **WHEN** `id`・`question`・`status` のみを持つエントリが `_questions.yaml` に存在する
- **THEN** パーサーはそのエントリを有効な `QuestionEntry` として返す

#### Scenario: ids による絞り込みができる
- **WHEN** `ids: [fct_orders]` が指定されたエントリが存在する
- **THEN** エンティティID `fct_orders` で絞り込み検索ができる

## REMOVED Requirements

### Requirement: `questions[].table` フィールド（単数）
**Reason**: `ids`（複数形・任意エンティティ対応）に統一。
**Migration**: `table: fct_orders` → `ids: [fct_orders]` にリネームする。
