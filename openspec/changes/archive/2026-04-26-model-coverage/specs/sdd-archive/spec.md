## ADDED Requirements

### Requirement: Coverage Policy 設定時に archive の merge 前にカバレッジゲートを実行する

`modscape:spec:archive` スキルは、`.modscape/modscape-spec.custom.md` に Coverage Policy（最小カバレッジ閾値）が設定されている場合、`modscape validate` の直後・merge の前に `modscape coverage` を実行しなければならない（SHALL）。

Coverage Policy が設定されていない場合、カバレッジチェックをスキップしなければならない（SHALL）。既存プロジェクトへの影響はゼロでなければならない（SHALL）。

カバレッジが閾値を下回る場合は警告を表示し、ユーザーに y/N で続行を確認しなければならない（SHALL）。ユーザーが N を選択した場合は merge をキャンセルしなければならない（SHALL）。ブロックではなく確認であるため、ユーザーが y を選択すれば閾値未満でも merge を続行できなければならない（SHALL）。

#### Scenario: Coverage Policy 設定時に閾値以上でそのまま続行する
- **WHEN** Coverage Policy が 70% に設定されており、spec-model.yaml の総合カバレッジが 75% の場合に archive を実行する
- **THEN** 「Coverage OK: 75% >= 70%」と表示されて merge ステップに進む

#### Scenario: Coverage Policy 設定時に閾値未満で確認を求める
- **WHEN** Coverage Policy が 70% に設定されており、spec-model.yaml の総合カバレッジが 45% の場合に archive を実行する
- **THEN** 「⚠ Coverage: 45% < 70% (threshold). Proceed anyway? (y/N)」と表示されてユーザーの入力を待つ

#### Scenario: 閾値未満でユーザーが y を選択して続行する
- **WHEN** カバレッジが閾値未満の状態で確認プロンプトに y を入力する
- **THEN** 警告を記録した上で merge ステップに進む

#### Scenario: 閾値未満でユーザーが N を選択してキャンセルする
- **WHEN** カバレッジが閾値未満の状態で確認プロンプトに N を入力する
- **THEN** 「Archive cancelled.」を表示して処理を終了し、main YAML への変更は行わない

#### Scenario: Coverage Policy が未設定の場合にスキップする
- **WHEN** `.modscape/modscape-spec.custom.md` に Coverage Policy が記述されていない状態で archive を実行する
- **THEN** カバレッジチェックをスキップして通常の validate → merge の流れで処理する
