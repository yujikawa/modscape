## MODIFIED Requirements

### Requirement: amendコマンドのsaveヒント
`/modscape:spec:amend` の出力末尾に、作業を中断する場合の save ヒントを表示しなければならない（SHALL）。

#### Scenario: amend セッション終了時のsaveヒント表示
- **WHEN** `/modscape:spec:amend <name>` の出力が完了する
- **THEN** 出力の末尾に「作業を中断する場合は `/modscape:spec:save <name>` を実行してください」というヒントを表示する
