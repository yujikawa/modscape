## Context

modscape:spec の SDD ワークフローには現在 2 つの「無確認通過点」がある：

1. **design → implement**: 未解決質問・仮定・AC 未カバーがあっても何も警告せずに実装へ進める
2. **implement → archive**: 本番 YAML へのマージが即実行され、何が変わるかを事前に確認できない

また `spec.md` の Acceptance Criteria は自由記述のチェックボックスで、`tasks.md` のテストタスクと紐付いていない。archive 後に「AC-2 の条件は本当に満たされたか」を追跡できない。

## Goals / Non-Goals

**Goals:**
- design 完了時に review サマリーを自動表示し、go/no-go を意識させる
- `/modscape:spec:review` を独立コマンドとして提供し、途中で中断・再開しやすくする
- AC に ID を付け、テストタスクとの対応を明示する
- archive 前に ID 単位の変更サマリーを表示してからマージを実行する

**Non-Goals:**
- unresolved questions によるハードブロック（仮定で進むことは許容）
- 自動テスト実行
- YAML diff 全文の表示（ID 単位サマリーで十分）

## Decisions

### 1. review は独立コマンド + design 末尾への埋め込みの両立

`design` の末尾で review ロジックを実行し、同じサマリーを出力する。「次ステップ」として `implement` と `review` を並列案内する。独立の `/modscape:spec:review <name>` コマンドは「サマリーを再表示するだけ」の軽量コマンドとして持つ。

```
✅ Design complete.

## Review Checkpoint

- 未解決の質問: 3 件 (questions.md 参照)
- 仮定:          2 件
- 下流分類の確信度が低いテーブル: dim_customer (lineage のみ)
- AC カバレッジ: 4/6 (AC-3, AC-5 → テスト自動生成不可・手動検証が必要)

⚠️ 問題が残っています。このまま実装に進みますか？
   → 実装: /modscape:spec:implement <name>
   → 再確認: /modscape:spec:review <name>
```

**理由**: 作業を中断してから再開するユーザーは review を再実行したい。独立コマンドを持つことで「今どんな状態か」を素早く確認できる。

### 2. AC は spec.md で AC-NNN ID を付与する

`requirements` スキルが AC を収集するとき、各 AC に連番 ID（`AC-001`, `AC-002`, ...）を付与する。

```markdown
## Acceptance Criteria
- [ ] AC-001: Order ID がユニークである
- [ ] AC-002: 売上合計がソースと 0.01% 以内で一致する  ← 手動検証
- [ ] AC-003: fct_orders に NULL の customer_id が存在しない
```

`tasks.md` の Phase 4 テストタスクに対応する AC-NNN を付記する：
```markdown
## Phase 4: Tests
- [ ] `fct_orders` — order_id: unique, not_null  [→ AC-001, AC-003]
- [ ] `fct_orders` → `dim_customers` FK test      [→ AC-003]
```

自動テスト生成できない AC（「数値が合う」等）は `[手動検証]` フラグを付け、archive サマリーで明示的に "未検証で閉じた" ことを記録する。

### 3. archive の dry-run はマージ前のサマリー確認

本番 YAML へのマージ前に以下を表示し、「このまま進めますか？」の確認を取る：

```
## Merge Preview

追加するテーブル:  fct_new_table, stg_source_x
更新するテーブル:  fct_orders（変更: +2 columns — revenue_net, tax_amount）
変更なし:          dim_customers（Context Only）

このまま main.yaml にマージしますか？ (y/N)
```

YAML diff 全文ではなく ID 単位の情報に留める。git 管理下にある場合は `git diff` で詳細を確認できるため、ここでの差分表示は不要。

## Risks / Trade-offs

- **AC-NNN の採番**: `requirements` スキルが AC ID を付けるが、ユーザーが後から AC を追加・削除した場合に番号が欠番になる。現状は許容（連番の連続性より存在することが重要）。
- **merge preview の精度**: `modscape merge --patch` の実際の動作と preview の表示が乖離する可能性。preview は「spec-model.yaml に存在するテーブル一覧」ベースの近似表示とし、実際のマージ結果と異なる場合があることを注記する。
- **手動検証 AC の追跡**: `[手動検証]` フラグを付けるだけで実際の検証を強制する手段はない。archive 時のサマリーで「未検証で閉じた AC」を明示することで、少なくとも意識的なスキップとして記録に残す。
