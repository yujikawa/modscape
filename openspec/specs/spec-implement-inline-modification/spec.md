## Requirements

### Requirement: ユーザー依頼の仕様修正をインラインで一括完結させる

`/modscape:spec:implement` の実装セッション中にユーザーが明示的に仕様の修正を依頼した場合、AI は修正の種類（列レベルの変更 / 構造変更）を問わず、コマンドを切り替えることなく以下のファイルをインラインで一括更新しなければならない（SHALL）。

**更新順序:**
1. `design.md` を更新する（`## Implementation Details` セクションの該当テーブル部分を修正）
2. `spec-model.yaml` を mutation CLI で更新し、`modscape validate` で検証する
3. `tasks.md` を外科的に更新する:
   - **列レベルの変更**: 変更テーブルに対応するタスクのチェックを `[x]` → `[ ]` に戻す（ユーザーが「はい」を選んだ場合）
   - **テーブル追加**: lineage から追加テーブルのフェーズ（Staging / Core / Mart）を判定し、適切な位置に新タスクを挿入する
   - **テーブル削除**: 対象テーブルのタスク行を削除する（完了済みの場合は削除不要）
   - **lineage / grain 変更**: 変更テーブルおよびその downstream テーブルに対応するタスクを `[ ]` に戻す

全ファイルの更新完了後、以下の形式で更新内容を提示し、実装継続の確認を求めなければならない（SHALL）:

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

#### Scenario: 列レベルの修正を依頼されてインライン完結する
- **WHEN** 実装中にユーザーが「`fct_orders.amount` の型を DECIMAL(18,2) に変えて」と依頼する
- **THEN** AI は design.md → spec-model.yaml → tasks.md を順に更新し、更新サマリーを表示して「実装を続けますか？」と確認する

#### Scenario: テーブル追加を依頼されてインライン完結する
- **WHEN** 実装中にユーザーが「`stg_payments` を追加して」と依頼する
- **THEN** AI は design.md → spec-model.yaml → tasks.md（新タスクを Staging フェーズに挿入）を更新し、更新サマリーを表示して「実装を続けますか？」と確認する

#### Scenario: テーブル削除を依頼されてインライン完結する
- **WHEN** 実装中にユーザーが「`dim_calendar` を削除して」と依頼する
- **THEN** AI は design.md → spec-model.yaml → tasks.md（対象タスク行を削除）を更新し、更新サマリーを表示して「実装を続けますか？」と確認する

#### Scenario: lineage 変更を依頼されて downstream タスクも戻す
- **WHEN** 実装中にユーザーが「`fct_orders` の upstream を `stg_orders` から `core_orders` に変えて」と依頼する
- **THEN** AI は design.md → spec-model.yaml → tasks.md（`fct_orders` および downstream テーブルのタスクを `[ ]` に戻す）を更新し、更新サマリーを表示して「実装を続けますか？」と確認する

#### Scenario: 修正後に「いいえ」を選んで中断する
- **WHEN** 更新サマリー後にユーザーが「いいえ」を選ぶ
- **THEN** AI は実装を中断し、save ヒントを表示する
