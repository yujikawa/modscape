## MODIFIED Requirements

### Requirement: spec.md と既存specを読み込んで spec-model.yaml を設計する
AIスキル `/modscape:spec:design <name>` は `changes/<name>/spec.md`・`specs/*.md`（既存の恒久テーブルspec）を読み込み、影響テーブルを自動特定して `changes/<name>/spec-model.yaml`（作業用YAML）を設計・更新しなければならない（SHALL）。本番のmodel.yaml（HR.yaml等）は直接変更してはならない（SHALL NOT）。

スキルは以下を実行しなければならない（SHALL）:
- `.modscape/rules.md`・`.modscape/changes/modscape-spec.custom.md`（存在する場合）・`specs/*.md`（存在する場合）を読み込む
- `spec.md` の Data Sources をもとに関連テーブルを自動判定し、`modscape extract` で `changes/<name>/spec-model.yaml` を生成する
- 新規テーブルを `changes/<name>/spec-model.yaml` に追加設計する
- 設計判断・影響テーブルリスト・実装詳細を `changes/<name>/design.md` に記録する
- 設計完了後に `modscape layout changes/<name>/spec-model.yaml` でレイアウトを更新する
- Direct Impact テーブルに関連する未解決質問を `design.md` の `## Known Open Questions` セクションに参照として挿入する
- `modscape spec search` を内部的に実行し、過去 archive を検索して `design.md` の `## Related Past Specs` に記録する

スキルは再実行可能でなければならず（SHALL）、再実行時は既存の `design.md` の Findings セクションを読み込み設計に反映しなければならない（SHALL）。

**design.md フォーマットの制約（拡張）:**
スキルが生成・更新する `design.md` は以下の構成を持たなければならない（SHALL）。`## Implementation Details` セクションは、実装者が `design.md` だけを参照して実装できる水準の詳細を記載する場所とする。

```markdown
## Design Decisions
<テーブル設計の判断・lineage・relationships の根拠>

## Affected Tables
### Direct Impact
### Downstream Impact — Implement
### Downstream Impact — Context Only

## Implementation Details
### <table-id>
- **変換式**: <expression の詳細>
- **フィルター条件**: <WHERE 句の条件>
- **検証SQL**: <受け入れ条件を検証するための SQL>
- **テストパターン**: <PK/FK テストの方針>

## Findings
### Implementation Notes
### Requires Model Change

## Known Open Questions
## Related Past Specs
```

`## Implementation Details` は省略可能だが、変換式・フィルター条件・検証SQLのいずれかが存在する場合は記載しなければならない（SHALL）。

**spec-model.yaml 変更後の AC 整合確認（必須）:**
スキルは `spec-model.yaml` を変更した後、`spec.md` の `## Acceptance Criteria` を確認し、矛盾がある場合は `spec.md` を修正しなければならない（SHALL）。

スキルは設計完了時に波及確認レポートを出力しなければならない（SHALL）。

**tasks.md のマージ挙動:**
スキルが `tasks.md` を生成・更新する際、`tasks.md` が既存かつ完了済みタスク（`[x]`）が存在する場合は上書きせず、以下のマージ処理を行わなければならない（SHALL）:
1. 差分（追加・削除・維持）をユーザーに提示する
2. ユーザーの確認を得てからマージ実行する

マージルール:
- 旧 `[x]` かつ新 `spec-model.yaml` に存在 → `[x]` を維持
- 新 `spec-model.yaml` に追加されたテーブル → `[ ]` で追加
- `spec-model.yaml` から削除されたテーブル → `tasks.md` からも除去

`tasks.md` が存在しない、または完了済みタスクが 0 件の場合は上書き生成する（既存動作）。

#### Scenario: 初回実行で design.md と tasks.md を生成する
- **WHEN** `changes/<name>/design.md` が存在しない状態で `/modscape:spec:design <name>` を実行する
- **THEN** AIは `spec-model.yaml` を設計し、`design.md`（`## Implementation Details` セクション含む）と `tasks.md` を新規作成する

#### Scenario: Implementation Details に変換式と検証 SQL を記載する
- **WHEN** テーブルに変換式やフィルター条件が存在する状態で設計が完了する
- **THEN** `design.md` の `## Implementation Details` セクションに当該テーブルの変換式・フィルター条件・検証 SQL が記載される

#### Scenario: tasks.md に完了済みタスクがある状態で再実行するとマージ確認が出る
- **WHEN** `changes/<name>/tasks.md` に `[x]` が 1 件以上ある状態で `/modscape:spec:design <name>` を再実行する
- **THEN** AIは差分（追加・削除・維持）を表示し、「続けますか？」と確認してからマージ実行する

#### Scenario: tasks.md の完了済みタスクが再実行後も保持される
- **WHEN** 設計変更で新テーブルが追加された後に spec:design を再実行し、ユーザーがマージを承認する
- **THEN** 既存の `[x]` タスクは維持され、新テーブルのタスクが `[ ]` として追加される

#### Scenario: 削除されたテーブルのタスクが除去される
- **WHEN** 設計変更でテーブルが `spec-model.yaml` から削除された後に spec:design を再実行し、ユーザーがマージを承認する
- **THEN** そのテーブルに対応するタスクが `tasks.md` から除去される
