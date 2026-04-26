## ADDED Requirements

### Requirement: Overview統計の表示
右パネルのModel StatsタブはモデルのOverview統計を表示しなければならない（SHALL）。表示項目はテーブル総数・リネージエッジ総数・リレーション総数・ドメイン総数の4つ。

#### Scenario: schemaが読み込まれた状態でタブを開く
- **WHEN** ユーザーがModel Statsタブを開く
- **THEN** テーブル数・リネージエッジ数・リレーション数・ドメイン数がカード形式で表示される

#### Scenario: lineageが空の場合
- **WHEN** schema.lineageが空またはundefinedの状態でタブを開く
- **THEN** リネージエッジ数は0として表示される

---

### Requirement: リネージホットスポットのランキング表示
Model Statsタブはテーブルごとのリネージ接続数合計（上流数＋下流数）をランキング順に表示しなければならない（SHALL）。

#### Scenario: 複数テーブルにリネージが存在する場合
- **WHEN** ユーザーがModel Statsタブを開く
- **THEN** リネージ接続数の多い順にテーブル一覧が並び、各行にテーブル名・CSSバー・合計数が表示される

#### Scenario: リネージが存在しない場合
- **WHEN** schema.lineageが空の状態でタブを開く
- **THEN** Lineage Hotspotsセクションには「No lineage data」等の空状態メッセージが表示される

---

### Requirement: 孤立テーブルの警告表示
Model Statsタブはschema.lineageに一度も登場しないテーブルを孤立テーブルとして検出し、警告セクションに一覧表示しなければならない（SHALL）。

#### Scenario: 孤立テーブルが存在する場合
- **WHEN** ユーザーがModel Statsタブを開く
- **THEN** Isolated Tablesセクションに孤立テーブルの件数と一覧が表示される

#### Scenario: 孤立テーブルが存在しない場合
- **WHEN** 全テーブルがlineageに登場する状態でタブを開く
- **THEN** Isolated Tablesセクションは表示されない（またはクリア状態として表示）

---

### Requirement: テーブルへのフォーカスナビゲーション
Model StatsタブのHotspotsおよびIsolated Tablesの各エントリーをクリックすると、キャンバス上の該当テーブルにフォーカスしなければならない（SHALL）。

#### Scenario: Hotspotsのテーブル行をクリックする
- **WHEN** ユーザーがLineage Hotspotsのテーブル行をクリックする
- **THEN** キャンバスが該当テーブルにスクロール・フォーカスし、DetailPanelが開く

#### Scenario: Isolated Tablesのエントリーをクリックする
- **WHEN** ユーザーがIsolated Tablesのテーブル行をクリックする
- **THEN** キャンバスが該当テーブルにスクロール・フォーカスし、DetailPanelが開く

---

## ADDED Requirements

### Requirement: Model Stats タブに手動実行の Documentation Coverage セクションを追加する

Model Stats タブは "Documentation Coverage" セクションを表示しなければならない（SHALL）。ただし、グラフ描画や操作感への影響を避けるため、カバレッジ計算はページ読み込み時や schema 変更時に自動実行してはならない（SHALL NOT）。ユーザーが "Calculate Coverage" ボタンをクリックした時のみ算出する。

カバレッジ計算ロジックは `modscape coverage` CLI と同一の計算式を用いなければならない（SHALL）:
- テーブルカバレッジ: `conceptual.description` 定義済みテーブル数 / 総テーブル数 × 100
- カラムカバレッジ: `type` 定義済みカラム数 / 総カラム数 × 100
- 総合カバレッジ: (テーブルカバレッジ + カラムカバレッジ) / 2

#### Scenario: ボタンクリックでカバレッジを算出する
- **WHEN** ユーザーが "Calculate Coverage" ボタンをクリックする
- **THEN** 総合カバレッジ・テーブルカバレッジ・カラムカバレッジがパーセンテージで表示される

#### Scenario: テーブル別カバレッジを一覧表示する
- **WHEN** カバレッジが算出済みの状態で Model Stats タブを表示する
- **THEN** per-table のカバレッジが一覧表示され、カバレッジの低い順にソートされる

#### Scenario: テーブルをクリックしてキャンバスにフォーカスする
- **WHEN** Coverage 一覧のテーブル行をクリックする
- **THEN** キャンバスが該当テーブルにスクロール・フォーカスし、DetailPanel が開く

#### Scenario: タブ初期表示時にはカバレッジを計算しない
- **WHEN** ユーザーが Model Stats タブを開く（ボタンクリック前）
- **THEN** Coverage セクションは「Calculate Coverage」ボタンのみを表示し、計算は実行しない

#### Scenario: schema が更新されてもカバレッジを自動再計算しない
- **WHEN** YAML ファイルが更新されて schema が再読み込みされる
- **THEN** 算出済みのカバレッジ結果はクリアされ、ボタンが再表示される（自動再計算はしない）
