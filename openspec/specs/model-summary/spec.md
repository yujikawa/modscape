## ADDED Requirements

### Requirement: モデル全体の統計サマリー取得
システムはYAMLモデル全体の統計情報を1回の呼び出しで返さなければならない（SHALL）。

#### Scenario: 通常のモデルに対してサマリーを取得
- **WHEN** `summary <file>` または `summarize_model` MCPツールを呼び出す
- **THEN** 以下の構造を含むオブジェクトを返す：
  - `tableCount`: テーブル総数
  - `byType`: タイプ別テーブル数（例: `{ fact: 3, dimension: 5 }`）
  - `domainCount`: ドメイン総数
  - `domains`: 各ドメインの `{ id, name, memberCount }`
  - `orphanTableIds`: いずれのドメインにも属していないテーブルIDの配列
  - `relationshipCount`: リレーションシップ総数
  - `lineageCount`: リネージエントリ総数
  - `annotationCount`: アノテーション総数

#### Scenario: 空のモデルに対してサマリーを取得
- **WHEN** テーブルもドメインも存在しないYAMLに対して呼び出す
- **THEN** 全カウントが0、空配列のオブジェクトを返す

---

### Requirement: 孤立テーブルの特定
システムはいずれのドメインにも属していないテーブルを `orphanTableIds` として返さなければならない（SHALL）。

#### Scenario: 孤立テーブルが存在する場合
- **WHEN** ドメインの `members` リストに含まれていないテーブルが存在する
- **THEN** そのテーブルIDが `orphanTableIds` に含まれる

#### Scenario: 全テーブルがドメインに属している場合
- **WHEN** 全テーブルがいずれかのドメインの `members` に含まれる
- **THEN** `orphanTableIds` は空配列を返す

---

### Requirement: CLIでの人間可読出力
`summary` CLIコマンドは `--json` なしの場合、人間が読みやすい形式で出力しなければならない（SHALL）。

#### Scenario: デフォルト出力
- **WHEN** `summary <file>` を実行する（`--json` なし）
- **THEN** テーブル数・ドメイン数・孤立テーブルなどをテキスト形式で出力する

#### Scenario: --jsonフラグ付き出力
- **WHEN** `summary <file> --json` を実行する
- **THEN** JSONオブジェクトを標準出力に出力する
