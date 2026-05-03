## MODIFIED Requirements

### Requirement: implementコマンドのsaveヒント
`/modscape:spec:implement` の出力末尾に、作業を中断する場合の save ヒントを表示しなければならない（SHALL）。

#### Scenario: implement セッション終了時のsaveヒント表示
- **WHEN** `/modscape:spec:implement <name>` の出力が完了する（完了・中断問わず）
- **THEN** 出力の末尾に「作業を中断する場合は `/modscape:spec:save <name>` を実行してください」というヒントを表示する
