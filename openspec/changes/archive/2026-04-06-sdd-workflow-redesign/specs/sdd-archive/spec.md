## ADDED Requirements

### Requirement: SDD作業完了時に恒久テーブルspecを自動同期する
AIスキル `/modscape:sdd:archive <name>` は `sdd/<name>/spec.md` と `sdd/<name>/design.md` を解析し、影響テーブルを特定して `.modscape/specs/<table-id>.md` を自動生成または更新しなければならない（SHALL）。

スキルは以下を実行しなければならない（SHALL）:
- `sdd/<name>/spec.md`・`sdd/<name>/design.md`・`model.yaml` の lineage を読み込む
- 直接影響テーブル（新規作成・変更されたテーブル）と間接影響テーブル（lineage上流）を自動判定する
- 直接影響テーブルに対して `specs/<table-id>.md` の Overview / Business Context / Business Rules / Known Issues を生成・更新する
- 間接影響テーブルに対して `specs/<table-id>.md` の Changelog のみ追記する
- 同期完了後「`sdd/<name>/` を削除しますか？」とユーザーに確認する

#### Scenario: 直接影響テーブルのspecを新規作成する
- **WHEN** `specs/<table-id>.md` が存在しない状態で archive を実行する
- **THEN** AIは `specs/<table-id>.md` を所定のフォーマットで新規作成し、Changelogに作業名と日付を記録する

#### Scenario: 直接影響テーブルの既存specを更新する
- **WHEN** `specs/<table-id>.md` が既存の状態で archive を実行する
- **THEN** AIは既存の内容を読み込み、変更された部分のみ差分更新してChangelogに追記する

#### Scenario: 間接影響テーブルのChangelogに追記する
- **WHEN** lineage上で上流に存在するテーブルがある状態で archive を実行する
- **THEN** AIは該当テーブルの `specs/<table-id>.md` のChangelogセクションのみに作業名と日付を追記する

#### Scenario: 同期完了後に削除確認を行う
- **WHEN** すべての `specs/<table-id>.md` の同期が完了する
- **THEN** AIは「`sdd/<name>/` を削除しますか？」と確認し、ユーザーの選択に応じて削除またはそのまま保持する

#### Scenario: 対象フォルダが存在しない場合にエラーを表示する
- **WHEN** 指定した `sdd/<name>/` が存在しない状態で archive を実行する
- **THEN** AIは「`sdd/<name>/` が見つかりません。フォルダ名を確認してください」と案内する
