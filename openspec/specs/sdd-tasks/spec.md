## MODIFIED Requirements

### Requirement: spec-model.yaml の lineage と domains から依存順にタスクを生成する

AIスキル `/modscape:spec:tasks <name>` は `spec-model.yaml` の `domains` と `lineage` を使い、ドメイン単位でフェーズを構成した `.modscape/changes/<name>/tasks.md` を生成しなければならない（SHALL）。

スキルは以下の手順でフェーズを決定しなければならない（SHALL）:
1. `domains` セクションから各ドメインの `name` と `members`（テーブルIDリスト）を取得する
2. `lineage` を使ってドメイン間の依存グラフを構築し、トポロジカルソートで順序を決める
3. 上流から順に Phase 1, Phase 2, ... と番号を振り、Phase名には `domains.name` をそのまま使用する
4. 各フェーズ内のテーブルを依存順（lineage）に従って列挙する

`consumers` セクションのノード（ダッシュボード等）は `tables` に存在しないため、フェーズ分類の対象外とし tasks.md に含めてはならない（SHALL NOT）。

各タスク行には以下のみを含めなければならない（SHALL）:
- テーブルID（バッククォートで表記）

以下を含めてはならない（SHALL NOT）:
- materialization 種別（`[table]` / `[incremental]` 等）
- upstream 依存記法（`←` 等）
- Tests フェーズ（Phase N: Tests）※ユーザーが任意で追記することは許容する

スキルは `.modscape/modscape-spec.custom.md` が存在する場合、フェーズ構成や追加タスクについてそのルールを優先して適用しなければならない（SHALL）。

#### Scenario: domains が定義された spec-model.yaml からタスクを生成する

- **WHEN** `domains` と `lineage` が定義された `spec-model.yaml` で `/modscape:spec:tasks <name>` を実行する
- **THEN** AIは `domains.name` をフェーズタイトルとして使用し、ドメインをトポロジカル順に Phase 1, Phase 2, ... と並べたタスク一覧を生成する
- **THEN** 各タスク行はテーブルIDのみを含み、materialization や upstream 記法を含まない

#### Scenario: 2ドメイン構成の spec でフェーズ名が動的に設定される

- **WHEN** `domains` に "Reference Data" と "Mart" が定義された spec-model.yaml でタスクを生成する
- **THEN** "Phase 1: Reference Data" と "Phase 2: Mart" のフェーズタイトルで tasks.md が生成される

#### Scenario: lineage が未定義の場合に案内メッセージを表示する

- **WHEN** `spec-model.yaml` に `lineage` セクションが存在しない状態でタスクを生成しようとする
- **THEN** AIは「spec-model.yaml に lineage が定義されていません。/modscape:spec:design を実行して lineage を追加してから再度実行してください」と案内する

#### Scenario: consumers ノードがフェーズに含まれない

- **WHEN** lineage に `consumers` のノードが含まれている spec-model.yaml でタスクを生成する
- **THEN** consumers ノードは tasks.md のいずれのフェーズにも出力されない

### Requirement: tasks.md 生成完了時に phase を tasks に更新する

`tasks` スキルは `tasks.md` を新規生成または更新完了した時点で `modscape spec set-phase <name> tasks` を実行し、`spec-config.yaml` のフェーズを `tasks` に更新しなければならない（SHALL）。

#### Scenario: tasks.md 生成完了時に phase が tasks に設定される

- **WHEN** `/modscape:spec:tasks <name>` が `tasks.md` を生成・更新して完了する
- **THEN** `modscape spec set-phase <name> tasks` が実行され、`spec-config.yaml` の `phase` が `tasks` に更新される

#### Scenario: tasks.md をマージ確認後に生成した場合も phase を tasks に設定する

- **WHEN** `tasks.md` の既存タスクとのマージをユーザーが承認した後に `tasks.md` の生成が完了する
- **THEN** `modscape spec set-phase <name> tasks` が実行される

## REMOVED Requirements

### Requirement: タスク行に materialization 種別を含める

**Reason**: AI が `physical.strategy` を正確に読み取れず毎回誤った値（`[view]` / `[increment]` 等）を生成する。また実装時に materialization を判断するには tasks.md より spec-model.yaml を直接参照するほうが正確であり、表示する意義がない。
**Migration**: tasks.md から `[<materialization>]` 表記を削除する。materialization の確認が必要な場合は `spec-model.yaml` の `physical.strategy` を参照すること。

### Requirement: タスク行に upstream 依存記法を含める

**Reason**: フェーズ順序自体が実装順（上流 → 下流）を表しているため、`← upstream` 記法は冗長。
**Migration**: tasks.md から `← upstream` 表記を削除する。依存関係の確認が必要な場合は `spec-model.yaml` の `lineage` を参照すること。

### Requirement: Phase 4: Tests を必須セクションとして生成する

**Reason**: テストの粒度や形式はプロジェクトによって異なる。固定セクションとして強制することで、不要なテストタスクが tasks.md に混入したり、生成内容が仕様と乖離したりするケースが多発していた。
**Migration**: スキルは Tests セクションを自動生成しない。テストタスクが必要な場合はユーザーが手動で tasks.md に追記する。

### Requirement: Phase名を Staging / Core / Mart にハードコードする

**Reason**: データモデルのドメイン構成はプロジェクトによって異なり（例: "Reference Data" / "Mart"）、固定フェーズ名が domains と一致しないケースで全フェーズが空になる問題が発生していた。
**Migration**: Phase名は `spec-model.yaml` の `domains.name` をトポロジカル順に使用する。既存の "Phase 1: Staging" 等の表記は次回の tasks 再生成時に自動的に置き換わる。
