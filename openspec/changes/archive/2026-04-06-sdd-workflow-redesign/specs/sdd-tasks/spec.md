## MODIFIED Requirements

### Requirement: model.yaml の lineage から依存順にタスクを生成する
AIスキル `/modscape:sdd:design <name>` は設計完了後に `model.yaml` の `lineage` セクションをトポロジカルソートし、実装フェーズごとに分類した `.modscape/sdd/<name>/tasks.md` を生成しなければならない（SHALL）。

スキルは以下のフェーズ構成でタスクを分類しなければならない（SHALL）:
- Phase 1: Staging（依存なしのテーブル）
- Phase 2: Core（1段上流のテーブル）
- Phase 3: Mart / 集計（最下流のテーブル）
- Phase 4: Tests（各テーブルのキーカラムに対するテスト）

各タスクには以下を含めなければならない（SHALL）:
- テーブルID（バッククォートで表記）
- materialization 種別（`implementation.materialization` または `appearance.type` から推定）
- 上流依存テーブル（`←` で表記）

スキルは `.modscape/sdd/sdd.custom.md` が存在する場合、フェーズ構成や追加タスクについてそのルールを優先して適用しなければならない（SHALL）。

#### Scenario: lineage が定義された model.yaml からタスクを生成する
- **WHEN** lineage セクションが存在する model.yaml で設計が完了する
- **THEN** AIは依存順にソートされたフェーズ別タスク一覧を `.modscape/sdd/<name>/tasks.md` として生成する

#### Scenario: lineage が未定義の場合に案内メッセージを表示する
- **WHEN** model.yaml に lineage セクションが存在しない状態で設計が完了する
- **THEN** AIは「model.yaml に lineage が定義されていません。lineage を追加してから再度実行してください」と案内する
