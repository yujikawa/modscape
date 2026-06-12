## ADDED Requirements

### Requirement: spec:implement スキルは対象テーブルの知識ベースをCLIで取得する

spec:implement スキルはコード生成タスクを処理する前に、対象テーブルIDに関連する知識を `modscape spec context --ids` コマンドで取得しなければならない（SHALL）。取得した decisions・rules・terms をコード生成の制約として使用しなければならない（SHALL）。

```bash
modscape spec context --ids <table-id1>,<table-id2>,... --json
```

知識の適用方法:
- `rules`: フィルター条件・JOIN条件・NULL処理など、コードに直接反映するルールとして使用する
- `rules[].counter_case` が存在する場合: 該当する局面では条件分岐や `-- NOTE:` コメントを追加する
- `decisions`: 計算式・集計の粒度・スキーマ設計の前提として使用する
- `terms`: ビジネス用語が示す実際のカラム・フィルター・計算式を把握するために使用する

`.modscape/specs/` が存在しない場合や、コマンドが空の結果を返した場合はスキップしてよい（MAY）。

#### Scenario: タスク処理前に対象テーブルの知識を取得してコードに反映する
- **WHEN** `fct_orders` のコード生成タスクを処理する
- **THEN** `modscape spec context --ids fct_orders --json` が実行され、返された rules のフィルター条件がSQLのWHERE句に反映される

#### Scenario: counter_case が存在する rules は条件分岐またはコメントを追加する
- **WHEN** `rules[].counter_case` に「キャンセル率分析の場合はcancelled行が必要」が含まれる
- **THEN** 生成コードに `-- NOTE: for cancellation-rate analysis, remove this filter` コメントが追加される

#### Scenario: 知識ベースが空でもコード生成が続行する
- **WHEN** `modscape spec context --ids <table-id> --json` が空の結果を返す
- **THEN** コード生成はエラーなく続行し、`-- TODO:` コメントで不明点を補完する
