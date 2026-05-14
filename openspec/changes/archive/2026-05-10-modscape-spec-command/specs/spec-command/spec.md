## ADDED Requirements

### Requirement: modscape spec サブコマンド体系
システムは `modscape spec` を名前空間として `dev` / `open` / `build` サブコマンドを提供しなければならない（SHALL）。

| コマンド | 説明 |
|---|---|
| `modscape spec dev <name>` | SDD 作業中変更のビューアを起動する |
| `modscape spec open` | 恒久 spec ブラウザを dev server として起動する |
| `modscape spec build [outDir]` | 恒久 spec ブラウザを静的 HTML として出力する |

#### Scenario: modscape spec を引数なしで実行するとヘルプが表示される
- **WHEN** `modscape spec` を引数なしで実行する
- **THEN** サブコマンド一覧とその説明が表示される
