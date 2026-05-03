## MODIFIED Requirements

### Requirement: requirementsコマンドのsaveヒント
`/modscape:spec:requirements` の出力末尾に、作業を中断する場合の save ヒントを表示しなければならない（SHALL）。

#### Scenario: requirements セッション終了時のsaveヒント表示
- **WHEN** `/modscape:spec:requirements <name>` の出力が完了する
- **THEN** 出力の末尾に「作業を中断する場合は `/modscape:spec:save <name>` を実行してください」というヒントを表示する
