## ADDED Requirements

### Requirement: SDD作業中は本番YAMLを直接編集しない
SDD作業中、AIスキルは本番のmodel.yaml（例: HR.yaml）を直接編集してはならない（SHALL NOT）。代わりにSDD作業フォルダ内に作業用YAMLを作成し、archiveのタイミングで本番YAMLにマージしなければならない（SHALL）。

作業用YAMLのパスは `.modscape/changes/<name>/model.yaml` でなければならない（SHALL）。

#### Scenario: designが本番YAMLを編集しない
- **WHEN** `/modscape:spec:design <name>` を実行する
- **THEN** 本番のmodel.yaml（HR.yaml等）は変更されず、`changes/<name>/model.yaml` のみが作成・更新される

#### Scenario: 作業用YAMLで開発サーバーを起動できる
- **WHEN** SDD作業中に開発サーバーを起動する
- **THEN** `modscape dev changes/<name>/model.yaml` で作業対象テーブルのみの絞り込みビューが表示される

### Requirement: archiveで作業用YAMLを本番YAMLにマージする
`/modscape:spec:archive <name>` はspec版を優先して本番YAMLにマージしなければならない（SHALL）。

マージは以下の順序で実行しなければならない（SHALL）:
```bash
modscape merge changes/<name>/model.yaml HR.yaml --output HR.yaml
```
spec側を先に置くことでfirst-winsの挙動によりspec版が優先される。

重複テーブルIDが検出された場合、archiveスキルはユーザーに警告を表示しなければならない（SHALL）。ただし警告はブロックせず、spec版を使用して処理を継続しなければならない（SHALL）。

#### Scenario: 新規テーブルのみの場合にサイレントにマージする
- **WHEN** `changes/<name>/model.yaml` のテーブルIDが本番YAMLに存在しない
- **THEN** `modscape merge` はすべてのテーブルを本番YAMLに追加し、警告なしで完了する

#### Scenario: 重複テーブルIDがある場合に警告を表示する
- **WHEN** `changes/<name>/model.yaml` に本番YAMLと同じIDのテーブルが存在する
- **THEN** `modscape merge` は `⚠ <table-id>: also exists in HR.yaml — using spec version` を表示し、spec版を使用してマージを完了する
