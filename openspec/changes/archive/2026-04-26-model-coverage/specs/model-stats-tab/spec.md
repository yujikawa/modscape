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
