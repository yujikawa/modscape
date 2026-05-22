## MODIFIED Requirements

### Requirement: tasks.md の未完了タスクを順に実装する
AIスキル `/modscape:spec:implement <name>` は `.modscape/changes/<name>/tasks.md` の未完了タスク（`- [ ]`）を Phase 順に1つずつ実装し、完了したタスクのチェックボックスを更新しなければならない（SHALL）。

スキルは以下を実行しなければならない（SHALL）:
- `.modscape/codegen-rules.md`・`.modscape/changes/modscape-spec.custom.md`（存在する場合）を読み込む
- `changes/<name>/spec-model.yaml`（作業用YAML）の対象テーブル定義を参照してコードを生成する
- タスク完了後に `changes/<name>/tasks.md` の該当行を `- [x]` に更新する
- 1タスク完了後に「次のタスクに進みますか？」と確認してから次へ進む

**【重要】生成済みファイルへの直接編集の禁止:**
スキルは生成済みファイル（dbt model, SQL ファイル等）を直接編集してはならない（SHALL NOT）。実装結果に修正が必要な場合は、必ず `design.md → spec-model.yaml → 再生成` の順で処理しなければならない（SHALL）。

スキルは `.modscape/changes/modscape-spec.custom.md` が存在する場合、ターゲットツールや出力フォーマットについてそのルールを優先して適用しなければならない（SHALL）。

スキルは `design.md` から **Context Only スキップリスト** を構築しなければならない（SHALL）:
- `.modscape/changes/<name>/design.md` が存在する場合: `### Downstream Impact — Context Only` セクションからすべてのテーブルIDを抽出してスキップリストに追加する
- `design.md` が存在しない、またはそのセクションが存在しない場合: スキップリストは空とし、すべてのテーブルを実装対象として扱う（後方互換）

スキップリストに含まれるテーブルIDのタスクは `⏭️ Skipping \`<id>\` (Context Only)` を出力してスキップしなければならない（SHALL）。

スキルは実装中に人間の調査なしに判断できない事項（例：型の不一致、想定外のNULL、ソースレコードの不在）を検知した場合、`.modscape/changes/<name>/questions.md` に質問を追記しなければならない（SHALL）。質問がある場合、実装を一時停止してユーザーに確認するか、仮定を記録して続行するかを選択しなければならない（SHALL）。

**実装中の修正指摘処理（改定）:**
スキルは実装セッション中にユーザーから修正指摘を受けた場合、修正の種類を問わずコマンドを切り替えることなくインラインで以下を一括更新しなければならない（SHALL）。生成済みファイルの直接編集は禁止する（SHALL NOT）。

**更新順序（すべての修正に共通）:**
1. `design.md` の該当テーブルセクション（`## Implementation Details` 含む）を更新する
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
| design.md | <更新箇所の説明> |
| spec-model.yaml | <変更内容> |
| tasks.md | <変更したタスクの一覧（追加・削除・チェック解除）> |

実装を続けますか？（はい / いいえ）
```

- ユーザーが「**はい**」→ 次の未完了タスクから実装を再開する
- ユーザーが「**いいえ**」→ 実装を中断する（save ヒントを表示する）

#### Scenario: 未完了タスクを順に実装する
- **WHEN** `changes/<name>/tasks.md` に未完了タスクが存在する状態で `/modscape:spec:implement <name>` を実行する
- **THEN** AIは `changes/<name>/spec-model.yaml` を参照して最初の未完了タスクのコードを生成し、tasks.md のチェックボックスを更新して次タスクへの確認を行う

#### Scenario: 実装中に不明な事項を questions.md に積む
- **WHEN** 実装中にAIが型の不一致や想定外のNULLを発見した
- **THEN** AIは `questions.md` に質問を追記し、ユーザーに確認するか仮定で進むかを提示する

#### Scenario: 修正指摘を受けてインラインで全ファイルを更新する
- **WHEN** 実装中にユーザーが「`fct_orders.amount` の型が DECIMAL(18,2) に変えてほしい」と指摘する
- **THEN** AIは生成済みの SQL ファイルを直接編集せず、design.md → spec-model.yaml → tasks.md の順に一括更新し、更新サマリーを表示して「実装を続けますか？」と確認する

#### Scenario: 修正後に「はい」を選んで実装を再開する
- **WHEN** 更新サマリー後にユーザーが「はい」を選ぶ
- **THEN** 次の未完了タスクから実装を再開する

#### Scenario: 修正後に「いいえ」を選んで中断する
- **WHEN** 更新サマリー後にユーザーが「いいえ」を選ぶ
- **THEN** 実装を中断し、save ヒントを表示する

#### Scenario: テーブル追加を依頼されてインライン完結する
- **WHEN** 実装中にユーザーが新しいテーブルの追加を依頼する
- **THEN** AI は design.md → spec-model.yaml → tasks.md（新タスクを適切なフェーズに挿入）を一括更新し、更新サマリーを表示して「実装を続けますか？」と確認する

#### Scenario: すべてのタスクが完了している場合にメッセージを表示する
- **WHEN** `changes/<name>/tasks.md` の全タスクが完了済み（`- [x]`）の状態で `/modscape:spec:implement <name>` を実行する
- **THEN** AIは「すべてのタスクが完了しています。`/modscape:spec:archive <name>` を実行してspecを同期してください」と案内する

#### Scenario: tasks.md が存在しない場合に案内メッセージを表示する
- **WHEN** `.modscape/changes/<name>/tasks.md` が存在しない状態で `/modscape:spec:implement <name>` を実行する
- **THEN** AIは「先に `/modscape:spec:design <name>` を実行してタスクリストを生成してください」と案内する

#### Scenario: Context Only テーブルをスキップする
- **WHEN** tasks.md のタスクが `design.md` の `### Downstream Impact — Context Only` に含まれるテーブルIDである
- **THEN** AIはコードを生成せず `⏭️ Skipping \`<id>\` (Context Only)` を出力して次のタスクに進む

#### Scenario: design.md が存在しない場合のフォールバック
- **WHEN** `.modscape/changes/<name>/design.md` が存在しない状態で `/modscape:spec:implement <name>` を実行する
- **THEN** スキップリストは空として扱い、tasks.md に含まれるすべてのテーブルを実装対象として処理する
