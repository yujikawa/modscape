## MODIFIED Requirements

### Requirement: 実装中に発覚した問題を SDD 成果物に反映できる
AIスキル `/modscape:spec:amend <name>` は、ユーザーが自由記述で渡した問題・エラー・設計変更を受け取り、`changes/<name>/` の成果物（spec.md / design.md / tasks.md / questions.md / spec-model.yaml）を差分更新しなければならない（SHALL）。

スキルは以下を行わなければならない（SHALL）:
- 入力内容を解析し、更新が必要な成果物を推定して差分更新する
- `tasks.md` の完了済みタスク（`- [x]`）は一切変更しない
- 修正タスクは `tasks.md` の末尾に `## Amend: <YYYY-MM-DD>` セクションとして追加する
- `questions.md` に追記する場合、既存の Q-NNN と重複しないよう質問テキストで重複チェックを行う
- 更新したファイルと変更箇所をサマリー表示する

スキルは `changes/<name>/` が存在しない場合、エラーを表示して停止しなければならない（SHALL）。

スキルはフローの任意のタイミングで何度でも呼び出せなければならない（SHALL）。

**更新対象の推定方針（拡張版）:**
- エラーメッセージ・型不一致・カラム名誤り → `spec.md` の関連 AC を修正 + `tasks.md` に修正タスク追加
- JOIN 前提の崩れ・設計の見直し → `design.md` の該当セクションを修正 + `tasks.md` に修正タスク追加
- モデルの構造変更（列追加・型変更・制約変更）→ `spec-model.yaml` を mutation CLI で即時修正し、`modscape validate` でエラーがないことを確認する。`spec.md` の該当 AC も同時に確認して必要なら修正する
- 未解決の疑問・要調査事項 → `questions.md` に Q-NNN で追記
- 複数に影響する場合 → 該当するすべての成果物を更新

**変更後の波及確認（必須）:**
すべての変更適用後、スキルは以下の3ファイルへの波及を確認して報告しなければならない（SHALL）:

```
## 波及確認レポート

| ファイル | 状態 | 内容 |
|---|---|---|
| spec.md | ✅ 影響なし / ✅ 更新済み / ⚠️ 要確認 | <変更内容または確認が必要な理由> |
| design.md | ✅ 影響なし / ✅ 更新済み / ⚠️ 要確認 | <変更内容または確認が必要な理由> |
| spec-model.yaml | ✅ 影響なし / ✅ 更新済み / ⚠️ 要確認 | <変更内容または確認が必要な理由> |
```

`spec-model.yaml` の**構造変化**（テーブル追加・削除・lineage 変更）を伴う場合は「設計変更」と判断し、ユーザーに確認を求めてから `/modscape:spec:design <name>` 再実行を案内しなければならない（SHALL）。列・制約・説明の修正は「軽微」と判断し、自動修正してレポートに記録する。

#### Scenario: SQL 実行エラーを渡して spec と tasks を更新する
- **WHEN** ユーザーが「`amount_jpy` カラムが存在しないエラーが出た。実際のカラム名は `amount` だった」と入力して `/modscape:spec:amend <name>` を実行する
- **THEN** `spec.md` の関連 Acceptance Criteria が修正され、`tasks.md` に `## Amend: <日付>` セクションと修正タスクが追加され、変更サマリーと波及確認レポートが表示される

#### Scenario: モデルの列変更を伴う発見を渡して spec-model.yaml も更新する
- **WHEN** ユーザーが「`fct_orders.amount` の型が INT ではなく DECIMAL だった」と入力する
- **THEN** `spec-model.yaml` の `fct_orders.amount` の型が mutation CLI で DECIMAL に更新され、`modscape validate` が実行され、`spec.md` の関連 AC も確認・修正される。波及確認レポートに `spec-model.yaml: ✅ 更新済み` と表示される

#### Scenario: 設計変更を伴う発見はユーザー確認後に design 再実行を案内する
- **WHEN** ユーザーが「`fct_orders` の grain が order_id ではなく order_line_id だった」と入力する
- **THEN** AI はこれを「設計変更」と判断し、変更内容を提示してユーザーに確認を求める。確認後、`design.md` の Findings に追記し `/modscape:spec:design <name>` 再実行を案内する。`spec-model.yaml` の構造変更は design 再実行まで保留する

#### Scenario: 設計前提の崩れを渡して design.md を更新する
- **WHEN** ユーザーが「`fct_orders` と `dim_customers` の JOIN キーが `customer_id` ではなく `user_id` だった」と入力する
- **THEN** `design.md` の該当する設計判断セクションが修正され、`tasks.md` に修正タスクが追加され、波及確認レポートが表示される

#### Scenario: 未解決疑問を渡して questions.md に追記する
- **WHEN** ユーザーが「`updated_at` が NULL になるケースがある。意図的か要確認」と入力する
- **THEN** `questions.md` に新しい Q-NNN として追記され、既存の同内容の質問との重複チェックが行われる

#### Scenario: 完了済みタスクは変更されない
- **WHEN** `/modscape:spec:amend <name>` を実行し `tasks.md` に修正タスクが追加される
- **THEN** `- [x]` マークが付いた既存の完了済みタスクは一切変更されない

#### Scenario: changes フォルダが存在しない場合はエラーを表示する
- **WHEN** 存在しない `<name>` で `/modscape:spec:amend <name>` を実行する
- **THEN** AIは「`changes/<name>/` not found. Run `/modscape:spec:requirements` to start a new spec.」と案内する

#### Scenario: 更新完了後に波及確認レポートを表示する
- **WHEN** `/modscape:spec:amend <name>` の処理が完了する
- **THEN** 更新したファイル名と変更箇所の一覧が表示され、3ファイル（spec.md / design.md / spec-model.yaml）それぞれの波及確認レポートが出力される
