## Requirements

### Requirement: spec.md と既存specを読み込んで spec-model.yaml を設計する
AIスキル `/modscape:spec:design <name>` は `changes/<name>/spec.md`・`specs/*.md`（既存の恒久テーブルspec）を読み込み、影響テーブルを自動特定して `changes/<name>/spec-model.yaml`（作業用YAML）を設計・更新しなければならない（SHALL）。本番のmodel.yaml（HR.yaml等）は直接変更してはならない（SHALL NOT）。

スキルは以下を実行しなければならない（SHALL）:
- `.modscape/rules.md`・`.modscape/changes/modscape-spec.custom.md`（存在する場合）・`specs/*.md`（存在する場合）を読み込む
- `spec.md` の Data Sources をもとに関連テーブルを自動判定し、`modscape extract` で `changes/<name>/spec-model.yaml` を生成する
- 新規テーブルを `changes/<name>/spec-model.yaml` に追加設計する
- 設計判断・影響テーブルリストを `changes/<name>/design.md` に記録する（テーブル非依存の情報のみ）
- テーブル固有の実装詳細を `changes/<name>/design/<table-id>.md` に記録する（1テーブル=1ファイル）
- 設計完了後に `modscape layout changes/<name>/spec-model.yaml` でレイアウトを更新する
- Direct Impact テーブルに関連する未解決質問を `design.md` の `## Known Open Questions` セクションに参照として挿入する
- `modscape spec search` を内部的に実行し、過去 archive を検索して `design.md` の `## Related Past Specs` に記録する

**1テーブル=1呼び出しモード:**
スキルは1回の呼び出しで未設計テーブルを1つだけ処理して終了しなければならない（SHALL）。複数テーブルが存在する場合、設計済みか否かは `changes/<name>/design/` 配下のファイル有無で判定する。処理後は「次のテーブルを設計するには再度 `/modscape:spec:design <name>` を実行してください」と案内しなければならない（SHALL）。

スキルは再実行可能でなければならず（SHALL）、再実行時は既存の `design.md` の Findings セクションを読み込み設計に反映しなければならない（SHALL）。

**design.md フォーマットの制約（改定）:**
スキルが生成・更新する `design.md` はテーブル非依存の情報のみを持たなければならない（SHALL）。`## Implementation Details` セクションは `design.md` に含めてはならない（SHALL NOT）。

```markdown
## Design Decisions
<テーブルを跨ぐ設計判断・lineage・relationships の全体方針>

## Affected Tables
| Table | Impact | Details |
|-------|--------|---------|
| `<table-id>` | Direct | new / column added / restructured |
| `<table-id>` | Downstream — Implement | <理由> |
| `<table-id>` | Downstream — Context Only | <理由> |

## Known Open Questions
## Related Past Specs

## Findings
### Requires Model Change
### Implementation Notes
```

**design/<table-id>.md フォーマット:**
テーブル固有の実装詳細は `changes/<name>/design/<table-id>.md` に記録しなければならない（SHALL）。

```markdown
# <table-id>

## Implementation Details

- **変換式**: <expression の詳細>
- **フィルター条件**: <WHERE 句の条件>
- **検証SQL**: <受け入れ条件を検証するための SQL>
- **テストパターン**: <PK/FK テストの方針>
```

`## Implementation Details` は省略可能だが、変換式・フィルター条件・検証SQLのいずれかが存在する場合は記載しなければならない（SHALL）。

スキルは `.modscape/changes/modscape-spec.custom.md` が存在する場合、そのルールを優先して適用しなければならない（SHALL）。

スキルは `changes/<name>/spec-model.yaml` の `lineage` セクションをトポロジカルソートし、実装フェーズごとに分類した `changes/<name>/tasks.md` を生成しなければならない（SHALL）。

tasks.md の Phase 4 テストタスクを生成する際、スキルは `spec.md` の `## Acceptance Criteria` から AC-NNN ID を読み込み、各テストタスクに対応する AC-NNN を `[→ AC-NNN]` 形式で付記しなければならない（SHALL）。自動テスト生成が困難な AC（数値一致検証等）は `[手動検証]` フラグを付けなければならない（SHALL）。

**tasks.md のマージ挙動:**
スキルが `tasks.md` を生成・更新する際、`tasks.md` が既存かつ完了済みタスク（`[x]`）が存在する場合は上書きせず、以下のマージ処理を行わなければならない（SHALL）:
1. 差分（追加・削除・維持）をユーザーに提示する
2. ユーザーの確認を得てからマージ実行する

マージルール:
- 旧 `[x]` かつ新 `spec-model.yaml` に存在 → `[x]` を維持
- 新 `spec-model.yaml` に追加されたテーブル → `[ ]` で追加
- `spec-model.yaml` から削除されたテーブル → `tasks.md` からも除去

`tasks.md` が存在しない、または完了済みタスクが 0 件の場合は上書き生成する（既存動作）。

**spec-model.yaml 変更後の AC 整合確認（必須）:**
スキルは `spec-model.yaml` を変更した後、必ず以下を確認しなければならない（SHALL）:
1. `spec.md` の `## Acceptance Criteria` を読み込み、変更されたテーブル・列に関連する AC を特定する
2. 変更内容と AC の内容が矛盾しないか確認する
3. 矛盾がある場合 → その場で `spec.md` を修正し、波及確認レポートに記載する
4. 矛盾がない場合 → 波及確認レポートに「spec.md: ✅ 影響なし」と記載する

**変更後の波及確認レポート（必須）:**
スキルは設計完了時に波及確認レポートを出力しなければならない（SHALL）。

タスクは以下のフェーズ構成で分類しなければならない（SHALL）:
- Phase 1: Staging（依存なしのテーブル）
- Phase 2: Core（1段上流のテーブル）
- Phase 3: Mart / 集計（最下流のテーブル）
- Phase 4: Tests（各テーブルのキーカラムに対するテスト）

各タスクには以下を含めなければならない（SHALL）:
- テーブルID（バッククォートで表記）
- materialization 種別（`implementation.materialization` または `appearance.type` から推定）
- 上流依存テーブル（`←` で表記）

#### Scenario: 初回実行で design.md と対象テーブルの design/<table-id>.md を生成する
- **WHEN** `changes/<name>/design/` ディレクトリが空の状態で `/modscape:spec:design <name>` を実行する
- **THEN** AIは最初の未設計テーブルを1つ選択し、`design.md`（SUMMARY ブロック・テーブル非依存情報）と `design/<table-id>.md`（そのテーブルの実装詳細）を新規作成して終了する

#### Scenario: 2回目の実行で次のテーブルを設計する
- **WHEN** `changes/<name>/design/fct_orders.md` が存在し、`dim_customers.md` が存在しない状態で `/modscape:spec:design <name>` を実行する
- **THEN** AIは `dim_customers` を次の設計対象として選択し、`design/dim_customers.md` を新規作成して終了する

#### Scenario: 全テーブル設計済みの場合に完了メッセージを表示する
- **WHEN** `changes/<name>/design/` 配下に全テーブル分のファイルが存在する状態で `/modscape:spec:design <name>` を実行する
- **THEN** AIは「すべてのテーブルの設計が完了しています。`/modscape:spec:implement <name>` を実行してください」と案内する

#### Scenario: Implementation Details に変換式と検証 SQL を記載する
- **WHEN** テーブルに変換式やフィルター条件が存在する状態で設計が完了する
- **THEN** `design/<table-id>.md` の `## Implementation Details` セクションに当該テーブルの変換式・フィルター条件・検証 SQL が記載される

#### Scenario: tasks.md に完了済みタスクがある状態で再実行するとマージ確認が出る
- **WHEN** `changes/<name>/tasks.md` に `[x]` が 1 件以上ある状態で `/modscape:spec:design <name>` を再実行する
- **THEN** AIは差分（追加・削除・維持）を表示し、「続けますか？」と確認してからマージ実行する

#### Scenario: tasks.md の完了済みタスクが再実行後も保持される
- **WHEN** 設計変更で新テーブルが追加された後に spec:design を再実行し、ユーザーがマージを承認する
- **THEN** 既存の `[x]` タスクは維持され、新テーブルのタスクが `[ ]` として追加される

#### Scenario: 削除されたテーブルのタスクが除去される
- **WHEN** 設計変更でテーブルが `spec-model.yaml` から削除された後に spec:design を再実行し、ユーザーがマージを承認する
- **THEN** そのテーブルに対応するタスクが `tasks.md` から除去される

#### Scenario: spec-model.yaml 変更後に AC 矛盾を検出して自動修正する
- **WHEN** `/modscape:spec:design <name>` 実行中に `fct_orders` へ `revenue_net` 列を追加し、`spec.md` に「`fct_orders` は `amount` 列のみを持つ」という AC が存在する
- **THEN** AIはその AC を特定し、`spec.md` を修正して `revenue_net` 列を AC に反映する

#### Scenario: AC に影響がない場合は更新せずレポートに記録する
- **WHEN** `/modscape:spec:design <name>` 実行中に `stg_raw_sales` のパーティションキーを変更したが、`spec.md` の AC にパーティションキーへの言及がない
- **THEN** `spec.md` は変更されず、波及確認レポートに `spec.md: ✅ 影響なし` と記載される

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
