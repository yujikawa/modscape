## MODIFIED Requirements

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

**Context Only スキップリストの取得（改定）:**
スキルは `design.md` の `## Affected Tables` から `Downstream — Context Only` に分類されたテーブルIDを読み取り、スキップリストを構築しなければならない（SHALL）。`design.md` はテーブル非依存の情報のみを持つ小さなファイルであるため、全文を読んでよい。
- `design.md` が存在する場合: `## Affected Tables` の `Context Only` 行からテーブルIDを抽出する
- `design.md` が存在しない場合: スキップリストは空とし、すべてのテーブルを実装対象として扱う

スキップリストに含まれるテーブルIDのタスクは `⏭️ Skipping \`<id>\` (Context Only)` を出力してスキップしなければならない（SHALL）。

**【重要】生成済みファイルへの直接編集の禁止:**
スキルは生成済みファイル（dbt model, SQL ファイル等）を直接編集してはならない（SHALL NOT）。実装結果に修正が必要な場合は、必ず `design/<table-id>.md → spec-model.yaml → 再生成` の順で処理しなければならない（SHALL）。

スキルは `.modscape/changes/modscape-spec.custom.md` が存在する場合、ターゲットツールや出力フォーマットについてそのルールを優先して適用しなければならない（SHALL）。

スキルは実装中に人間の調査なしに判断できない事項を検知した場合、`.modscape/changes/<name>/questions.md` に質問を追記しなければならない（SHALL）。

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

#### Scenario: すべてのタスクが完了している場合にメッセージを表示する
- **WHEN** `changes/<name>/tasks.md` の全タスクが完了済み（`- [x]`）の状態で `/modscape:spec:implement <name>` を実行する
- **THEN** AIは「すべてのタスクが完了しています。`/modscape:spec:archive <name>` を実行してspecを同期してください」と案内する

#### Scenario: 実装中に不明な事項を questions.md に積む
- **WHEN** 実装中にAIが型の不一致や想定外のNULLを発見した
- **THEN** AIは `questions.md` に質問を追記し、ユーザーに確認するか仮定で進むかを提示する

#### Scenario: design.md が存在しない場合のフォールバック
- **WHEN** `.modscape/changes/<name>/design.md` が存在しない状態で `/modscape:spec:implement <name>` を実行する
- **THEN** スキップリストは空として扱い、tasks.md に含まれるすべてのテーブルを実装対象として処理する

## ADDED Requirements

### Requirement: implementコマンドのsaveヒント
`/modscape:spec:implement` の出力末尾に、作業を中断する場合の save ヒントを表示しなければならない（SHALL）。

#### Scenario: implement セッション終了時のsaveヒント表示
- **WHEN** `/modscape:spec:implement <name>` の出力が完了する（完了・中断問わず）
- **THEN** 出力の末尾に「作業を中断する場合は `/modscape:spec:save <name>` を実行してください」というヒントを表示する
