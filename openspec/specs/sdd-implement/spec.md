## Requirements

### Requirement: tasks.md の未完了タスクを順に実装する
AIスキル `/modscape:spec:implement <name>` は `.modscape/changes/<name>/tasks.md` の未完了タスク（`- [ ]`）を Phase 順に処理し、完了したタスクのチェックボックスを更新しなければならない（SHALL）。

**1タスク=1呼び出しモード:**
スキルは1回の呼び出しで未完了タスクを1つだけ実装して終了しなければならない（SHALL）。実装完了後は「次のタスクを実装するには再度 `/modscape:spec:implement <name>` を実行してください」と案内しなければならない（SHALL）。

スキルは以下を実行しなければならない（SHALL）:
- `.modscape/codegen-rules.md`・`.modscape/changes/modscape-spec.custom.md`（存在する場合）を読み込む
- `changes/<name>/spec-model.yaml`（作業用YAML）の対象テーブル定義を参照してコードを生成する
- `changes/<name>/design/<table-id>.md` が存在する場合、対象テーブルの実装詳細をそのファイルから読み込む
- `changes/<name>/design/<table-id>.md` が存在しない場合（移行期の後方互換）、`design.md` の `## Implementation Details` セクションから対象テーブルの情報を読み込む
- タスク完了後に `changes/<name>/tasks.md` の該当行を `- [x]` に更新する

**【重要】生成済みファイルへの直接編集の禁止:**
スキルは生成済みファイル（dbt model, SQL ファイル等）を直接編集してはならない（SHALL NOT）。実装結果に修正が必要な場合は、必ず `design/<table-id>.md → spec-model.yaml → 再生成` の順で処理しなければならない（SHALL）。

スキルは `.modscape/changes/modscape-spec.custom.md` が存在する場合、ターゲットツールや出力フォーマットについてそのルールを優先して適用しなければならない（SHALL）。

**Context Only スキップリストの取得（改定）:**
スキルは `design.md` の `## Affected Tables` から `Downstream — Context Only` に分類されたテーブルIDを読み取り、スキップリストを構築しなければならない（SHALL）。`design.md` はテーブル非依存の情報のみを持つ小さなファイルであるため、全文を読んでよい。
- `design.md` が存在する場合: `## Affected Tables` の `Context Only` 行からテーブルIDを抽出する
- `design.md` が存在しない場合: スキップリストは空とし、すべてのテーブルを実装対象として扱う

スキップリストに含まれるテーブルIDのタスクは `⏭️ Skipping \`<id>\` (Context Only)` を出力してスキップしなければならない（SHALL）。

スキルは実装中に人間の調査なしに判断できない事項（例：型の不一致、想定外のNULL、ソースレコードの不在）を検知した場合、`.modscape/changes/<name>/questions.md` に質問を追記しなければならない（SHALL）。質問がある場合、実装を一時停止してユーザーに確認するか、仮定を記録して続行するかを選択しなければならない（SHALL）。

**実装中の修正指摘処理（改定）:**
スキルは実装セッション中にユーザーから修正指摘を受けた場合、修正の種類（列レベルの変更 / 構造変更）を問わずコマンドを切り替えることなく以下のファイルをインラインで一括更新しなければならない（SHALL）。生成済みファイルの直接編集は禁止する（SHALL NOT）。

**更新順序（すべての修正に共通）:**
1. `design/<table-id>.md` の該当テーブルセクション（`## Implementation Details` 含む）を更新する
2. `spec-model.yaml` を mutation CLI で修正し、`modscape validate` で検証する
3. `tasks.md` を外科的に更新する（影響タスクのみ）:
   - **列レベルの変更**: 変更テーブルに対応するタスクを `[ ]` に戻す（ユーザーが「はい」を選んだ場合）
   - **テーブル追加**: lineage から追加テーブルのフェーズを判定し、適切な位置に新タスクを挿入する
   - **テーブル削除**: 対象テーブルのタスク行を削除する
   - **lineage / grain 変更**: 変更テーブルおよびその downstream テーブルのタスクを `[ ]` に戻す
4. 更新サマリーを表示して「実装を続けますか？（はい / いいえ）」と確認する

更新サマリーのフォーマット:
```
✅ 修正完了。

| ファイル | 更新内容 |
|---|---|
| design/<table-id>.md | <更新箇所の説明> |
| spec-model.yaml | <変更内容> |
| tasks.md | <変更したタスクの一覧（追加・削除・チェック解除）> |

実装を続けますか？（はい / いいえ）
```

- ユーザーが「**はい**」→ 次の未完了タスクから実装を再開する
- ユーザーが「**いいえ**」→ 実装を中断する（save ヒントを表示する）

#### Scenario: 未完了タスクを1つだけ実装して終了する
- **WHEN** `changes/<name>/tasks.md` に未完了タスクが存在する状態で `/modscape:spec:implement <name>` を実行する
- **THEN** AIは最初の未完了タスクのコードを1つだけ生成し、tasks.md のチェックボックスを更新して「次のタスクを実装するには再度実行してください」と案内して終了する

#### Scenario: design/<table-id>.md から実装詳細を読み込む
- **WHEN** `changes/<name>/design/fct_orders.md` が存在する状態で `fct_orders` のタスクを実装する
- **THEN** AIは `design/fct_orders.md` の `## Implementation Details` を参照してコードを生成する

#### Scenario: design/<table-id>.md がない場合は design.md にフォールバックする
- **WHEN** `changes/<name>/design/fct_orders.md` が存在せず `design.md` の `## Implementation Details` に `fct_orders` セクションが存在する
- **THEN** AIは `design.md` から情報を読み込んでコードを生成する（後方互換）

#### Scenario: Affected Tables から Context Only リストを読む
- **WHEN** `design.md` の `## Affected Tables` に `stg_legacy | Downstream — Context Only` の行が存在する
- **THEN** AIは `stg_legacy` のタスクを `⏭️ Skipping \`stg_legacy\` (Context Only)` として処理する

#### Scenario: 実装中に不明な事項を questions.md に積む
- **WHEN** 実装中にAIが型の不一致や想定外のNULLを発見した
- **THEN** AIは `questions.md` に質問を追記し、ユーザーに確認するか仮定で進むかを提示する

#### Scenario: 修正指摘を受けてインラインで全ファイルを更新する
- **WHEN** 実装中にユーザーが「`fct_orders.amount` の型が DECIMAL(18,2) に変えてほしい」と指摘する
- **THEN** AIは生成済みの SQL ファイルを直接編集せず、design/<table-id>.md → spec-model.yaml → tasks.md の順に一括更新し、更新サマリーを表示して「実装を続けますか？」と確認する

#### Scenario: 修正後に「はい」を選んで実装を再開する
- **WHEN** 更新サマリー後にユーザーが「はい」を選ぶ
- **THEN** 次の未完了タスクから実装を再開する

#### Scenario: 修正後に「いいえ」を選んで中断する
- **WHEN** 更新サマリー後にユーザーが「いいえ」を選ぶ
- **THEN** 実装を中断し、save ヒントを表示する

#### Scenario: テーブル追加を依頼されてインライン完結する
- **WHEN** 実装中にユーザーが新しいテーブルの追加を依頼する
- **THEN** AI は design/<table-id>.md → spec-model.yaml → tasks.md（新タスクを適切なフェーズに挿入）を一括更新し、更新サマリーを表示して「実装を続けますか？」と確認する

#### Scenario: すべてのタスクが完了している場合にメッセージを表示する
- **WHEN** `changes/<name>/tasks.md` の全タスクが完了済み（`- [x]`）の状態で `/modscape:spec:implement <name>` を実行する
- **THEN** AIは「すべてのタスクが完了しています。`/modscape:spec:archive <name>` を実行してspecを同期してください」と案内する

#### Scenario: tasks.md が存在しない場合に案内メッセージを表示する
- **WHEN** `.modscape/changes/<name>/tasks.md` が存在しない状態で `/modscape:spec:implement <name>` を実行する
- **THEN** AIは「先に `/modscape:spec:design <name>` を実行してタスクリストを生成してください」と案内する

#### Scenario: Context Only テーブルをスキップする
- **WHEN** tasks.md のタスクが `design.md` の `## Affected Tables` の `Context Only` 列に含まれるテーブルIDである
- **THEN** AIはコードを生成せず `⏭️ Skipping \`<id>\` (Context Only)` を出力して次のタスクに進む

#### Scenario: design.md が存在しない場合のフォールバック
- **WHEN** `.modscape/changes/<name>/design.md` が存在しない状態で `/modscape:spec:implement <name>` を実行する
- **THEN** スキップリストは空として扱い、tasks.md に含まれるすべてのテーブルを実装対象として処理する

## ADDED Requirements

### Requirement: implementコマンドのsaveヒント
`/modscape:spec:implement` の出力末尾に、作業を中断する場合の save ヒントを表示しなければならない（SHALL）。

#### Scenario: implement セッション終了時のsaveヒント表示
- **WHEN** `/modscape:spec:implement <name>` の出力が完了する（完了・中断問わず）
- **THEN** 出力の末尾に「作業を中断する場合は `/modscape:spec:save <name>` を実行してください」というヒントを表示する

---

## ADDED Requirements

### Requirement: spec:implement スキルは対象テーブルの知識ベースをCLIで取得する

`/modscape:spec:implement <name>` スキルは各タスク処理前に対象テーブルIDを特定し、`modscape spec context` CLIコマンドを使って関連知識を取得しなければならない（SHALL）。

取得した知識（decisions・rules・terms）をコード生成の参照情報として使用しなければならない（SHALL）。

```
modscape spec context --ids <table-id> --json
```

#### Scenario: 各タスク処理前に対象テーブルの知識を取得する
- **WHEN** `fct_orders` のタスクを処理する前に `/modscape:spec:implement <name>` を実行する
- **THEN** スキルは `modscape spec context --ids fct_orders --json` を実行し、返却された decisions/rules/terms をコード生成に利用する

#### Scenario: CLI から取得した知識をコード生成に適用する
- **WHEN** `modscape spec context --ids fct_orders --json` が `status='cancelled' を除外する` ルールを返す
- **THEN** 生成されたSQLにそのフィルター条件が反映される

---

## ADDED Requirements

### Requirement: implement 初回実行時に phase を implement に更新する

`implement` スキルは最初のタスクを処理する前（初回呼び出し時のみ）に `modscape spec set-phase <name> implement` を実行し、`spec-config.yaml` のフェーズを `implement` に更新しなければならない（SHALL）。

初回かどうかの判定: `modscape spec get <name> --json` の `phase` が `implement` でない場合を初回とみなす。

#### Scenario: 初回 implement 実行時に phase が implement に設定される
- **WHEN** `spec-config.yaml` の `phase` が `tasks` の状態で `/modscape:spec:implement <name>` を初めて実行する
- **THEN** `modscape spec set-phase <name> implement` が実行され、タスク処理が開始される

#### Scenario: 既に implement フェーズの場合は set-phase をスキップする
- **WHEN** `spec-config.yaml` の `phase` が既に `implement` の状態で `/modscape:spec:implement <name>` を再実行する
- **THEN** `modscape spec set-phase` は実行されず、次の未完了タスクから処理を再開する
