## ADDED Requirements

### Requirement: `.modscape/specs/` をテーブル単位ディレクトリ構造で管理する
`.modscape/specs/` はテーブル単位のサブディレクトリで構成されなければならない（SHALL）。

```
.modscape/specs/
├── _context.yaml              ← SDD 横断メタデータ
└── <table-id>/
    ├── spec.md                ← 業務文脈・設計決定
    └── questions.md           ← テーブル単位 Q&A
```

`specs/_context.yaml` には `model.yaml` が持たない SDD 固有のメタデータのみを格納しなければならない（SHALL）。`model.yaml` に既にある `description`・`kind`・`tags` は格納してはならない（SHALL NOT）。

```yaml
tables:
  fct_orders:
    last_change: 2026-03-10-monthly-sales-summary
    open_questions: 2
    has_spec: true

decisions:
  - id: D-001
    summary: "amount は税抜で統一"
    date: 2026-03-10
    affects: [fct_orders, mart_revenue]
    change: monthly-sales-summary
```

#### Scenario: テーブルディレクトリが自動生成される
- **WHEN** archive を実行し Direct Impact テーブル `fct_orders` が存在する
- **THEN** `.modscape/specs/fct_orders/spec.md` と `.modscape/specs/fct_orders/questions.md` が生成される

#### Scenario: `_context.yaml` が archive 時に更新される
- **WHEN** archive を実行する
- **THEN** `_context.yaml` の対象テーブルに `last_change`・`open_questions`・`has_spec` が書き込まれる

#### Scenario: `_context.yaml` に `model.yaml` と重複する情報は含まれない
- **WHEN** `_context.yaml` を参照する
- **THEN** `description`・`kind`・`tags` は含まれておらず、SDD 固有メタデータのみが含まれている

### Requirement: ビジュアライザーが `_context.yaml` を参照して SDD メタデータを表示する
ビジュアライザーは `_context.yaml` が存在する場合、テーブルカードと詳細パネルに SDD メタデータを表示しなければならない（SHALL）。`_context.yaml` が存在しない場合は何も表示せず、既存の表示に影響を与えてはならない（SHALL NOT）。

表示仕様：
- テーブルカード: `open_questions > 0` のとき ❓ バッジを表示する
- テーブルカード: `has_spec: true` のとき 📝 バッジを表示する
- 詳細パネル: `last_change` と `open_questions` 件数を表示する
- サイドバー新タブ "Decisions": `decisions` リストを表示する

#### Scenario: open_questions があるテーブルにバッジが表示される
- **WHEN** `_context.yaml` で `fct_orders.open_questions: 2` が設定されている
- **THEN** `fct_orders` テーブルカードに ❓ バッジが表示される

#### Scenario: `_context.yaml` が存在しない場合は既存 UI に影響しない
- **WHEN** `.modscape/specs/_context.yaml` が存在しない
- **THEN** テーブルカードにバッジは表示されず、既存の表示と変わらない

#### Scenario: Decisions タブに横断判断が表示される
- **WHEN** `_context.yaml` の `decisions` に1件以上のエントリがある
- **THEN** サイドバーの "Decisions" タブにリスト形式で表示される
