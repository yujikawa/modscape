## ADDED Requirements

### Requirement: `modscape-spec.custom.md` に Coverage Policy セクションを追加できる

`.modscape/modscape-spec.custom.md` は `## Coverage Policy` セクションを記述できなければならない（SHALL）。このセクションに最小カバレッジ閾値を記述すると、`modscape:spec:check` および `modscape:spec:archive` スキルが自動でこの値を読み取り、カバレッジチェックを実行する。

記述例:
```markdown
## Coverage Policy
- Minimum documentation coverage: 70%
```

セクションが存在しない場合、または閾値が記述されていない場合は、check・archive ともにカバレッジチェックを完全にスキップしなければならない（SHALL）。

`modscape init --sdd` で生成される `modscape-spec.custom.md.example` には Coverage Policy セクションのコメントアウト例が含まれなければならない（SHALL）。

#### Scenario: Coverage Policy を設定してカバレッジチェックを有効化する
- **WHEN** `## Coverage Policy` セクションに `Minimum documentation coverage: 70%` を記述した状態で `modscape:spec:check` を実行する
- **THEN** スキルが Coverage Policy を読み取り、spec-model.yaml のカバレッジを算出して結果を表示する

#### Scenario: Coverage Policy セクションがない場合はスキップする
- **WHEN** `modscape-spec.custom.md` に `## Coverage Policy` セクションが存在しない状態で `modscape:spec:check` を実行する
- **THEN** カバレッジチェックをスキップし、Coverage セクションは出力に現れない

#### Scenario: example テンプレートに Coverage Policy の例が含まれる
- **WHEN** `modscape init --claude --sdd` を実行する
- **THEN** 生成される `modscape-spec.custom.md.example` に Coverage Policy セクションのコメントアウト例が含まれる
