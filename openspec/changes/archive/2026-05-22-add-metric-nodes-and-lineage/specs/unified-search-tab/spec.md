## MODIFIED Requirements

### Requirement: 統合 Search タブの表示切り替え
右パネルの Search タブは検索ワードの有無によって表示内容を自動切り替えしなければならない（SHALL）。

#### Scenario: 未入力時はドメイン階層ツリーを表示する
- **WHEN** ユーザーが Search タブを開き検索ワードを入力していない
- **THEN** ドメインでグルーピングされたテーブル/Consumer/Metricのツリー一覧が表示される

#### Scenario: 入力時はフルテキスト検索結果を表示する
- **WHEN** ユーザーが検索ワードを入力する
- **THEN** テーブル名・論理名・物理名・説明・カラム名・カラム説明・Metric名・Metric計算式（expression）をキーワードでマッチしたヒット結果が表示される

#### Scenario: 検索ワードをクリアするとツリーに戻る
- **WHEN** ユーザーが検索ワードを削除して空にする
- **THEN** ドメイン階層ツリー表示に戻る

#### Scenario: Metric名で検索できる
- **WHEN** ユーザーがMetricの `name` に一致するキーワードを入力する
- **THEN** 該当するMetricが検索結果に表示される

#### Scenario: Metricの計算式で検索できる
- **WHEN** ユーザーがMetricの `expression` に含まれる文字列を入力する
- **THEN** 該当するMetricが検索結果に表示される
