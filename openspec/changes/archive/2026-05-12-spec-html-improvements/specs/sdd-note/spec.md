## MODIFIED Requirements

### Requirement: テーブルIDを指定して spec ファイルに知識を追記できる

AIスキル `/modscape:spec:note <table-id>` は、指定されたテーブルのspecファイルに対して、フリーテキストで渡された知識を適切なセクションに追記しなければならない（SHALL）。

`output_format: html` が設定されている場合、対象ファイルは `specs/<model-slug>/<table-id>.html` とし、HTMLファイルを読み書きしなければならない（SHALL）。HTMLファイルのセクション検索は、見出し要素（`<h2>` 等）またはセクションIDを使用して行わなければならない（SHALL）。

`output_format` が未設定またはデフォルトの場合、対象ファイルは `specs/<table-id>/spec.md` とする（既存動作を維持）。

書き込み先セクションの判断ルール（SHALL）:
- ビジネスルール・計算ロジック・定義 → `## Business Rules`（HTMLでは対応するセクション）
- 既知の問題・データ品質の注意点 → `## Known Issues / Caveats`（HTMLでは対応するセクション）
- 背景・経緯・意図 → `## Business Context`（HTMLでは対応するセクション）
- オーナー・SLA・更新頻度 → `## Overview`（HTMLでは対応するセクション）
- 上記に分類できない場合 → `## Known Issues / Caveats`（HTMLでは対応するセクション）

書き込みの前に更新内容のプレビューを表示し、ユーザーの確認を得てからファイルを更新しなければならない（SHALL）。

対象specファイルが存在しない場合は書き込みを行わず、エラーメッセージを表示して終了しなければならない（SHALL）。

#### Scenario: テーブルIDを指定してビジネスルールを追記する（MDモード）
- **WHEN** `output_format` が設定されていない状態で `/modscape:spec:note fct_orders` を実行し「fct_orders の grain は1注文につき1行」と入力する
- **THEN** `specs/fct_orders/spec.md` の `## Business Rules` に該当テキストが追記される
- **THEN** 書き込み前に更新内容のプレビューが表示され、確認を求められる

#### Scenario: テーブルIDを指定してビジネスルールを追記する（HTMLモード）
- **WHEN** `output_format: html` が設定された状態で `/modscape:spec:note fct_orders` を実行し知識を入力する
- **THEN** `specs/<model-slug>/fct_orders.html` の Business Rules セクションに該当テキストが追記される
- **THEN** 書き込み前に更新内容のプレビューが表示され、確認を求められる

#### Scenario: spec ファイルが存在しないテーブルを指定した場合
- **WHEN** `/modscape:spec:note fct_nonexistent` を実行する
- **THEN** 対象のspecファイルが見つからないというエラーが表示される
- **THEN** ファイルへの書き込みは行われない

### Requirement: テーブルIDを指定せずにフリーテキストから対象を自動推定できる

`/modscape:spec:note`（引数なし）は、ユーザーが入力したフリーテキストを解析して言及されているテーブルIDを自動推定し、該当するspecファイルを更新対象として提示しなければならない（SHALL）。

複数のテーブルが言及されている場合は、それぞれのspecに分配して更新内容を提示しなければならない（SHALL）。

ユーザーの確認後にのみファイルを更新しなければならない（SHALL）。

#### Scenario: テーブルIDなしで複数テーブルの情報を入力する
- **WHEN** `/modscape:spec:note` を実行し「fct_orders の Q1 2023 の updated_at は壊れてる。dim_customers は SCD Type2 で grain は有効期間ごとの行」と入力する
- **THEN** AIが `fct_orders` と `dim_customers` の2テーブルを推定する
- **THEN** 「以下のspecを更新します: ...」という確認プレビューが表示される
- **THEN** ユーザーが承認後、それぞれの specファイルが更新される

#### Scenario: テーブルIDを推定できない入力の場合
- **WHEN** `/modscape:spec:note` を実行し「このテーブルは更新が遅い」のように特定テーブルを特定できないテキストを入力する
- **THEN** 「対象テーブルを特定できませんでした。`/modscape:spec:note <table-id>` でテーブルIDを指定してください」と表示される
- **THEN** ファイルへの書き込みは行われない

### Requirement: 書き込み前に確認プレビューを表示する

知識を書き込む前に、更新対象ファイルと追記内容のプレビューを常に表示し、ユーザーの確認を求めなければならない（SHALL）。

プレビューには以下を含まなければならない（SHALL）:
- 更新対象の spec ファイルパス
- 追記先セクション名
- 追記するテキスト内容

ユーザーが拒否した場合はファイルを更新せずに終了しなければならない（SHALL）。

#### Scenario: 確認プレビューの表示
- **WHEN** `/modscape:spec:note fct_orders` を実行し知識を入力する
- **THEN** 「以下の更新を行います: specs/fct_orders/spec.md / Known Issues: <入力内容>」の形式でプレビューが表示される
- **THEN** `[Y/n]` または同等の確認を求める表示が出る

#### Scenario: ユーザーが確認を拒否した場合
- **WHEN** プレビュー表示後にユーザーが `n` または拒否を入力する
- **THEN** ファイルは更新されない
- **THEN** 「更新をキャンセルしました」と表示される

### Requirement: SDD ワークフローの外側で動作する

`/modscape:spec:note` は `changes/<name>/` などのアクティブな変更コンテキストを必要とせずに動作しなければならない（SHALL）。

対象は常に恒久テーブルspecファイルであり、`changes/<name>/spec.md` や `changes/<name>/spec.html`（変更固有の要件ファイル）は対象にしてはならない（SHALL NOT）。

#### Scenario: アクティブな変更がない状態で実行できる
- **WHEN** `.modscape/changes/` が空またはアクティブな変更が存在しない状態で `/modscape:spec:note fct_orders` を実行する
- **THEN** エラーなく動作し、対象の恒久specファイルが更新される
