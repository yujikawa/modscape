## MODIFIED Requirements

### Requirement: テーブルIDを指定して spec.md に知識を追記できる

AIスキル `/modscape:spec:note <table-id>` は、指定されたテーブルの `specs/<table-id>/spec.md` に対して、フリーテキストで渡された知識を適切なセクションに追記しなければならない（SHALL）。

対象ファイルは常に `.md` 形式とする（HTMLモード廃止のため `output_format` による切り替えは行わない）。

書き込み先セクションの判断ルール（SHALL）:
- ビジネスルール・計算ロジック・定義 → `## Business Rules`
- 既知の問題・データ品質の注意点 → `## Known Issues / Caveats`
- 背景・経緯・意図 → `## Business Context`
- オーナー・SLA・更新頻度 → `## Overview`
- 上記に分類できない場合 → `## Known Issues / Caveats`

書き込みの前に更新内容のプレビューを表示し、ユーザーの確認を得てからファイルを更新しなければならない（SHALL）。

`specs/<table-id>/spec.md` が存在しない場合は書き込みを行わず、エラーメッセージを表示して終了しなければならない（SHALL）。

#### Scenario: テーブルIDを指定してビジネスルールを追記する
- **WHEN** `/modscape:spec:note fct_orders` を実行し「fct_orders の grain は1注文につき1行」と入力する
- **THEN** `specs/fct_orders/spec.md` の Business Rules セクションに該当テキストが追記される
- **THEN** 書き込み前に更新内容のプレビューが表示され、確認を求められる
