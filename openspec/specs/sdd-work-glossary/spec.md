## ADDED Requirements

### Requirement: work-scoped な glossary.md でフェーズをまたいで用語を蓄積できる
`.modscape/changes/<name>/glossary.md` は SDD 作業中に発見されたビジネス用語を記録する一時ファイルである。requirements / design フェーズで用語が出たときにここに追記し、archive 時に `_glossary.yaml` にマージして削除される。

用語化の対象（SHALL）：
- プロジェクト固有・社内用語・略語
- 一般語だがこのプロジェクト内で特定の意味を持つ言葉

用語化の対象外（SHALL NOT）：
- SQL の一般用語（JOIN, GROUP BY, NULL 等）
- データモデリングの標準概念（fact, dimension, hub, satellite 等）
- 自明なカラム名（created_at, id 等）

フォーマット：
```markdown
## <change-name>

- **<term-id>**: <definition>
  - label: <日本語名>（任意）
  - tables: <table_a>, <table_b>（任意）
  - columns: <table_a.col>（任意）
```

#### Scenario: requirements フェーズで新用語が出たら glossary.md に追記される
- **WHEN** requirements スキル実行中にプロジェクト固有のビジネス用語が会話に登場する
- **THEN** `.modscape/changes/<name>/glossary.md` に該当用語が追記される

#### Scenario: design フェーズで新用語が出たら glossary.md に追記される
- **WHEN** design スキル実行中にテーブル定義やビジネスルールの文脈でプロジェクト固有の用語が登場する
- **THEN** `.modscape/changes/<name>/glossary.md` に該当用語が追記される

#### Scenario: glossary.md が存在しない場合は新規作成される
- **WHEN** 用語を記録しようとしたとき `.modscape/changes/<name>/glossary.md` が存在しない
- **THEN** ファイルを新規作成して用語を追記する

#### Scenario: 一般的な SQL/データモデリング用語は記録しない
- **WHEN** requirements / design 中に「JOIN」「fact テーブル」「NULL」などの一般用語が登場する
- **THEN** glossary.md には追記しない
