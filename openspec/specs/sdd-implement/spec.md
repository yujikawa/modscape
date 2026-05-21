## Requirements

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
スキルは実装セッション中にユーザーから修正指摘を受けた場合、以下の順序で処理しなければならない（SHALL）。生成済みファイルの直接編集は禁止する（SHALL NOT）。

発見の重さに応じて以下の分岐で処理しなければならない（SHALL）:

**軽微な修正**（列の型・制約・名前・説明の変更、AC の文言修正、変換式の変更）:
1. `design.md` の該当テーブルセクション（`## Implementation Details` 含む）を先に更新する
2. `spec-model.yaml` を mutation CLI で修正し、`modscape validate` で検証する
3. `spec.md` の関連 AC を確認し、必要なら修正する
4. 変更内容をユーザーに提示する
5. 「このタスクを未完了（[ ]）に戻して実装し直しますか？」とユーザーに確認する
6. ユーザーが「はい」→ タスクを `[ ]` に戻してから SQL を再生成する
7. ユーザーが「いいえ」→ 修正内容は次回ビルド時に反映される旨を伝えて次のタスクへ進む

**設計変更を伴う修正**（テーブル追加・削除・lineage 変更・grain 変更）:
1. `design.md` の `## Findings > ### Requires Model Change` に記録する
2. ユーザーに設計変更が必要であることを伝え、実装を中断する
3. `/modscape:spec:design <name>` の再実行を案内する

判断基準: `spec-model.yaml` の構造（テーブル・lineage・relationships の追加・削除）が変わる場合は「設計変更」とする。列レベルの変更（型・制約・名前・説明・expression）は「軽微」とする。

波及確認レポートのフォーマット:
```
## 波及確認レポート（インライン修正）

発見: <指摘内容の1行サマリー>
分類: 軽微な修正 / 設計変更

| ファイル | 状態 | 内容 |
|---|---|---|
| design.md | ✅ 更新済み | <変更内容> |
| spec.md | ✅ 影響なし / ✅ 更新済み | <変更内容> |
| spec-model.yaml | ✅ 更新済み / ⏸ 保留（design 再実行が必要） | <変更内容> |

このタスクを未完了（[ ]）に戻して実装し直しますか？ [y/N]
```

#### Scenario: 未完了タスクを順に実装する
- **WHEN** `changes/<name>/tasks.md` に未完了タスクが存在する状態で `/modscape:spec:implement <name>` を実行する
- **THEN** AIは `changes/<name>/spec-model.yaml` を参照して最初の未完了タスクのコードを生成し、tasks.md のチェックボックスを更新して次タスクへの確認を行う

#### Scenario: 実装中に不明な事項を questions.md に積む
- **WHEN** 実装中にAIが型の不一致や想定外のNULLを発見した
- **THEN** AIは `questions.md` に質問を追記し、ユーザーに確認するか仮定で進むかを提示する

#### Scenario: 修正指摘を受けたとき design.md を先に更新する
- **WHEN** タスク完了後にユーザーが「`fct_orders.amount` の型が DECIMAL(18,2) に変えてほしい」と指摘する
- **THEN** AIは生成済みの SQL ファイルを直接編集せず、まず `design.md` の該当テーブルセクションを更新し、次に `spec-model.yaml` を mutation CLI で修正し、波及確認レポートを出力してからタスクを戻すかユーザーに確認する

#### Scenario: タスクを戻すか確認してユーザーが「はい」を選ぶ
- **WHEN** 軽微な修正の波及確認レポート後にユーザーが「はい」を選ぶ
- **THEN** タスクを `[ ]` に戻し、SQL を再生成して実装し直す

#### Scenario: タスクを戻すか確認してユーザーが「いいえ」を選ぶ
- **WHEN** 軽微な修正の波及確認レポート後にユーザーが「いいえ」を選ぶ
- **THEN** タスクは `[x]` のまま次のタスクへ進み、修正内容は次回ビルド時に反映される旨を伝える

#### Scenario: 設計変更を伴う指摘で実装が中断される
- **WHEN** 実装中にユーザーが「中間テーブルを追加したい」と伝える
- **THEN** AIは「設計変更」と判断し、`design.md` の Findings に記録し、実装を中断して `/modscape:spec:design <name>` の再実行を案内する

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

## ADDED Requirements

### Requirement: implementコマンドのsaveヒント
`/modscape:spec:implement` の出力末尾に、作業を中断する場合の save ヒントを表示しなければならない（SHALL）。

#### Scenario: implement セッション終了時のsaveヒント表示
- **WHEN** `/modscape:spec:implement <name>` の出力が完了する（完了・中断問わず）
- **THEN** 出力の末尾に「作業を中断する場合は `/modscape:spec:save <name>` を実行してください」というヒントを表示する
