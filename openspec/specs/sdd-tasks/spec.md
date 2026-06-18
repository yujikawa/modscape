## MERGED into sdd-design

このスペックの要件は `sdd-design` に統合されました。
`/modscape:spec:design <name>` スキルが設計完了後に tasks.md を生成する責務を担います。

詳細は `openspec/specs/sdd-design/spec.md` を参照してください。

---

## MODIFIED Requirements (archived)

### Requirement: model.yaml の lineage から依存順にタスクを生成する
AIスキル `/modscape:spec:design <name>` は設計完了後に `model.yaml` の `lineage` セクションをトポロジカルソートし、実装フェーズごとに分類した `.modscape/changes/<name>/tasks.md` を生成しなければならない（SHALL）。

スキルは以下のフェーズ構成でタスクを分類しなければならない（SHALL）:
- Phase 1: Staging（依存なしのテーブル）
- Phase 2: Core（1段上流のテーブル）
- Phase 3: Mart / 集計（最下流のテーブル）
- Phase 4: Tests（各テーブルのキーカラムに対するテスト）

各タスクには以下を含めなければならない（SHALL）:
- テーブルID（バッククォートで表記）
- materialization 種別（`implementation.materialization` または `appearance.type` から推定）
- 上流依存テーブル（`←` で表記）

スキルは `.modscape/changes/modscape-spec.custom.md` が存在する場合、フェーズ構成や追加タスクについてそのルールを優先して適用しなければならない（SHALL）。

#### Scenario: lineage が定義された model.yaml からタスクを生成する
- **WHEN** lineage セクションが存在する model.yaml で設計が完了する
- **THEN** AIは依存順にソートされたフェーズ別タスク一覧を `.modscape/changes/<name>/tasks.md` として生成する

#### Scenario: lineage が未定義の場合に案内メッセージを表示する
- **WHEN** model.yaml に lineage セクションが存在しない状態で設計が完了する
- **THEN** AIは「model.yaml に lineage が定義されていません。lineage を追加してから再度実行してください」と案内する

---

## ADDED Requirements

### Requirement: tasks.md 生成完了時に phase を tasks に更新する

`design` スキル（tasks.md 生成を担当）は `tasks.md` を新規生成または更新完了した時点で `modscape spec set-phase <name> tasks` を実行し、`spec-config.yaml` のフェーズを `tasks` に更新しなければならない（SHALL）。

このフェーズ更新は `design` スキルの責務として実行される（`design` スキルが `tasks.md` を生成するため）。

#### Scenario: tasks.md 生成完了時に phase が tasks に設定される
- **WHEN** `/modscape:spec:design <name>` が `tasks.md` を生成・更新して完了する
- **THEN** `modscape spec set-phase <name> tasks` が実行され、`spec-config.yaml` の `phase` が `tasks` に更新される

#### Scenario: tasks.md をマージ確認後に生成した場合も phase を tasks に設定する
- **WHEN** `tasks.md` の既存タスクとのマージをユーザーが承認した後に `tasks.md` の生成が完了する
- **THEN** `modscape spec set-phase <name> tasks` が実行される
