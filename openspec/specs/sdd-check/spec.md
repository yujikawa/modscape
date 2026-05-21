## Requirements

### Requirement: SSOT 指定型の整合性チェック
AIスキル `/modscape:spec:check <name> [--from <artifact>]` は、指定された SSOT アーティファクトを基準として他のアーティファクトの整合性を検証しなければならない（SHALL）。

`--from` が省略された場合は `spec-model.yaml` を SSOT とする。

指定可能な SSOT:
- `spec-model.yaml`（デフォルト）
- `design.md`
- `spec.md`

SSOT ごとのチェック対象:

| SSOT | 検証対象 | チェック内容 |
|---|---|---|
| `spec-model.yaml` | design.md | 全テーブルが Affected Tables に分類されているか |
| `spec-model.yaml` | tasks.md | Direct Impact テーブルにタスクが存在するか |
| `spec-model.yaml` | questions.md | 未解決 Q に対応する assumption が design.md にあるか |
| `design.md` | spec-model.yaml | Implementation Details のテーブルが spec-model.yaml に存在するか |
| `design.md` | tasks.md | Direct Impact テーブルにタスクが存在するか |
| `design.md` | spec.md | AC が design.md の設計決定と矛盾していないか |
| `spec.md` | design.md | 全 AC が design.md で言及されているか |
| `spec.md` | tasks.md | 全 AC に Phase 4 テストタスクまたは manual verification があるか |

SSOT によらず常に実行する Readiness チェック:
- 未解決質問（questions.md の open Q）のカウントと一覧
- assumption の一覧（design.md / questions.md の Assumption ブロック）
- AC Coverage（spec.md の AC-NNN ごとに Phase 4 タスクの有無を確認）
- Documentation Coverage（modscape-spec.custom.md の Coverage Policy が設定されている場合のみ）

#### Scenario: デフォルト SSOT（spec-model.yaml）でチェックする
- **WHEN** ユーザーが `/modscape:spec:check <name>` を実行する（`--from` 省略）
- **THEN** spec-model.yaml を SSOT として、design.md・tasks.md・questions.md の整合性を検証し、Readiness チェック結果と合わせてレポートを表示する

#### Scenario: design.md を SSOT としてチェックする
- **WHEN** ユーザーが `/modscape:spec:check <name> --from design.md` を実行する
- **THEN** design.md を SSOT として、spec-model.yaml・tasks.md・spec.md の整合性を検証する

#### Scenario: spec.md を SSOT としてチェックする
- **WHEN** ユーザーが `/modscape:spec:check <name> --from spec.md` を実行する
- **THEN** spec.md を SSOT として、design.md・tasks.md の整合性を検証する

### Requirement: 修正方向の明示
チェック結果で不整合が見つかった場合、スキルは「SSOT が正しいので他を直せ」という修正方向を明示しなければならない（SHALL）。

#### Scenario: 不整合が見つかったときの案内
- **WHEN** design.md に spec-model.yaml にないテーブルが記載されている
- **THEN** 「design.md の `<table-id>` は spec-model.yaml に存在しません。design.md を更新してください。」と表示する

#### Scenario: SSOT 側に問題が疑われる場合
- **WHEN** spec-model.yaml にあるテーブルが design.md に未分類のとき
- **THEN** 「spec-model.yaml の `<table-id>` が design.md の Affected Tables に分類されていません。`/modscape:spec:design <name>` を再実行して分類してください。」と表示する

### Requirement: チェック結果の総合判定
スキルはチェック結果を ✅ Ready / ⚠️ Caution / 🚫 Blocker の 3 段階で評価しなければならない（SHALL）。

#### Scenario: 問題なし
- **WHEN** 全チェックに ❌ 不整合がなく、未解決 Q・未カバー AC が 0 件のとき
- **THEN** `✅ No issues found. Ready to implement.` と表示する

#### Scenario: 警告あり
- **WHEN** ⚠️ 警告のみで ❌ 不整合がない（open Q や assumption あり）
- **THEN** `⚠️ Issues found above. Review before implementing.` と表示する

#### Scenario: ブロッカーあり
- **WHEN** ❌ 不整合が 1 件以上ある
- **THEN** `🚫 Blocking issues found. Fix inconsistencies before implementing.` と表示する
