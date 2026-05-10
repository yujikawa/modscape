## Requirements

### Requirement: spec.md と既存specを読み込んで spec-model.yaml を設計する
AIスキル `/modscape:spec:design <name>` は `changes/<name>/spec.md`・`specs/*.md`（既存の恒久テーブルspec）を読み込み、影響テーブルを自動特定して `changes/<name>/spec-model.yaml`（作業用YAML）を設計・更新しなければならない（SHALL）。本番のmodel.yaml（HR.yaml等）は直接変更してはならない（SHALL NOT）。

スキルは以下を実行しなければならない（SHALL）:
- `.modscape/rules.md`・`.modscape/changes/modscape-spec.custom.md`（存在する場合）・`specs/*.md`（存在する場合）を読み込む
- `spec.md` の Data Sources をもとに関連テーブルを自動判定し、`modscape extract <master>.yaml --tables <ids> --with-downstream` で `changes/<name>/spec-model.yaml` を生成する（Downstream Impact のテーブルも自動包含）
- 新規テーブルを `changes/<name>/spec-model.yaml` に追加設計する（mutation CLIの対象は `changes/<name>/spec-model.yaml`）
- 設計判断と影響テーブルリストを `changes/<name>/design.md` に記録する
- 設計完了後に `modscape layout changes/<name>/spec-model.yaml` でレイアウトを更新する
- Direct Impact テーブルに関連する `specs/questions.md` の未解決質問（`- [ ]`）を検索し、該当する Q-NNN ID を `design.md` の `## Known Open Questions` セクションに参照として挿入する（本文コピーは行わない）
- `modscape spec search <keyword> --json` を内部的に実行し、Direct Impact テーブル名をキーワードとして過去 archive を検索する。マッチがあれば `design.md` の `## Related Past Specs` セクションに archive パスとタイトルを記録する

スキルは再実行可能でなければならず（SHALL）、再実行時は以下を行わなければならない（SHALL）:
- 既存の `changes/<name>/design.md` の気づきセクションを読み込み設計に反映する
- `changes/<name>/tasks.md` の完了済みタスク（`- [x]`）を保持したまま未完了部分を差分更新する

スキルは `.modscape/changes/modscape-spec.custom.md` が存在する場合、そのルールを優先して適用しなければならない（SHALL）。

スキルは `changes/<name>/spec-model.yaml` の `lineage` セクションをトポロジカルソートし、実装フェーズごとに分類した `changes/<name>/tasks.md` を生成しなければならない（SHALL）。

tasks.md の Phase 4 テストタスクを生成する際、スキルは `spec.md` の `## Acceptance Criteria` から AC-NNN ID を読み込み、各テストタスクに対応する AC-NNN を `[→ AC-NNN]` 形式で付記しなければならない（SHALL）。自動テスト生成が困難な AC（数値一致検証等）は `[手動検証]` フラグを付けなければならない（SHALL）。

**spec-model.yaml 変更後の AC 整合確認（必須・拡張）:**
スキルは `spec-model.yaml` を変更した後、必ず以下を確認しなければならない（SHALL）:
1. `spec.md` の `## Acceptance Criteria` を読み込み、変更されたテーブル・列に関連する AC を特定する
2. 変更内容と AC の内容が矛盾しないか確認する
3. 矛盾がある場合 → その場で `spec.md` を修正し、変更内容を波及確認レポートに記載する
4. 矛盾がない場合 → 波及確認レポートに「spec.md: ✅ 影響なし」と記載する

**変更後の波及確認レポート（必須）:**
スキルは設計完了時に以下のレポートを出力しなければならない（SHALL）:

```
## 波及確認レポート

| ファイル | 状態 | 内容 |
|---|---|---|
| spec.md | ✅ 影響なし / ✅ 更新済み | <変更内容> |
| design.md | ✅ 更新済み | <更新内容の概要> |
| spec-model.yaml | ✅ 更新済み | <変更テーブル・変更内容の概要> |
```

スキルは設計完了後に review サマリーを表示しなければならない（SHALL）。review サマリーには以下を含めなければならない（SHALL）:
- `questions.md` の未解決質問件数と Q-NNN 一覧
- `design.md` 内の仮定の件数
- AC カバレッジ（テスト紐付き / 手動検証 / 未カバーの件数）
- 下流分類の確信度が低いテーブル一覧

タスクは以下のフェーズ構成で分類しなければならない（SHALL）:
- Phase 1: Staging（依存なしのテーブル）
- Phase 2: Core（1段上流のテーブル）
- Phase 3: Mart / 集計（最下流のテーブル）
- Phase 4: Tests（各テーブルのキーカラムに対するテスト）

各タスクには以下を含めなければならない（SHALL）:
- テーブルID（バッククォートで表記）
- materialization 種別（`implementation.materialization` または `appearance.type` から推定）
- 上流依存テーブル（`←` で表記）

#### Scenario: 未完了タスクを順に実装する
- **WHEN** `changes/<name>/tasks.md` に未完了タスクが存在する状態で `/modscape:spec:design <name>` を再実行する
- **THEN** AIは `spec-model.yaml` を更新し、`spec.md` の AC との整合を確認し、必要なら `spec.md` を修正する。波及確認レポートを出力する

#### Scenario: spec-model.yaml 変更後に AC 矛盾を検出して自動修正する
- **WHEN** `/modscape:spec:design <name>` 実行中に `fct_orders` へ `revenue_net` 列を追加し、`spec.md` に「`fct_orders` は `amount` 列のみを持つ」という AC が存在する
- **THEN** AIはその AC を特定し、`spec.md` を修正して `revenue_net` 列を AC に反映する。波及確認レポートに `spec.md: ✅ 更新済み` と記載する

#### Scenario: AC に影響がない場合は更新せずレポートに記録する
- **WHEN** `/modscape:spec:design <name>` 実行中に `stg_raw_sales` のパーティションキーを変更したが、`spec.md` の AC にパーティションキーへの言及がない
- **THEN** `spec.md` は変更されず、波及確認レポートに `spec.md: ✅ 影響なし` と記載される

#### Scenario: design.md が存在しない場合のフォールバック
- **WHEN** `.modscape/changes/<name>/design.md` が存在しない状態で `/modscape:spec:design <name>` を初回実行する
- **THEN** `spec-model.yaml` を新規生成し、`design.md` を作成し、AC 整合確認を行った後に波及確認レポートを出力する

## ADDED Requirements

### Requirement: design フェーズで発見した用語を glossary.md に記録する
design スキルはテーブル定義・ビジネスルールの文脈で登場したプロジェクト固有のビジネス用語を `.modscape/changes/<name>/glossary.md` に記録しなければならない（SHALL）。

用語の記録は design 完了後のステップとして実行する。`glossary.md` が存在しない場合は新規作成する。

#### Scenario: design 完了後に用語が glossary.md に記録される
- **WHEN** design スキルが完了し、テーブル設計の文脈でプロジェクト固有の用語が登場していた
- **THEN** `.modscape/changes/<name>/glossary.md` に該当用語が追記される

#### Scenario: 登録対象の用語がなければスキップされる
- **WHEN** design スキルが完了したが、プロジェクト固有の用語が登場しなかった
- **THEN** glossary.md への書き込みはスキップされる

### Requirement: design スキルが影響範囲確認に lineage list --from --recursive を案内する
design スキルは既存テーブルを変更する場合、影響範囲を `modscape lineage list --from <tableId> --recursive` で事前確認する手順を示さなければならない（SHALL）。

#### Scenario: 既存テーブルの変更時に影響範囲コマンドが案内される
- **WHEN** design スキルが既存テーブルへの変更を含む spec を処理する
- **THEN** 影響範囲の確認手段として `modscape lineage list <file> --from <tableId> --recursive --json` の実行例を出力に含める

### Requirement: designコマンドのsaveヒント
`/modscape:spec:design` の出力末尾に、作業を中断する場合の save ヒントを表示しなければならない（SHALL）。

#### Scenario: design セッション終了時のsaveヒント表示
- **WHEN** `/modscape:spec:design <name>` の出力が完了する
- **THEN** 出力の末尾に「作業を中断する場合は `/modscape:spec:save <name>` を実行してください」というヒントを表示する
