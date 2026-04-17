## Context

現在の `.modscape/specs/` は以下の構造になっている：

```
.modscape/specs/
├── questions.md         ← 全テーブル混在のフラットファイル
├── <table-id>.md        ← テーブル単位の平面ファイル
└── .gitkeep
```

この構造には2つの問題がある：
1. **スケールしない** — テーブル数が増えると `questions.md` が巨大になり、AI エージェントが特定テーブルの Q&A だけを取得できない
2. **知識が分散している** — `model.yaml` は技術構造、`specs/<id>.md` は業務文脈、`questions.md` は Q&A が別々に存在し、AI エージェントやビジュアライザーが「テーブル単位でまとまった知識」を取り出せない

また SDD ワークフローで蓄積した横断的な設計判断（decisions）や変更履歴（last_change）を参照できる場所がない。

## Goals / Non-Goals

**Goals:**
- `.modscape/specs/` をテーブル単位ディレクトリ構造に再編する
- `_context.yaml` で横断メタデータ（last_change・open_questions・decisions）を管理する
- `archive` スキルが新構造に書き込むよう更新する
- ビジュアライザーが `_context.yaml` を参照して SDD メタデータを表示する

**Non-Goals:**
- `model.yaml` のフォーマット変更
- ベクターストアや意味検索の導入
- 既存アーカイブ（`changes/archive/`）の遡及マイグレーション

## Decisions

### ディレクトリ構造

**決定**: 以下の構造に移行する。

```
.modscape/specs/
├── _context.yaml              ← SDD 横断メタデータ
└── <table-id>/
    ├── spec.md                ← 業務文脈・設計決定
    └── questions.md           ← テーブル単位 Q&A
```

**理由**: ディレクトリ単位にすることで将来 `decisions.md` 等を追加できる拡張性を確保しつつ、AI エージェントが「このテーブルについて知りたい」ときに `specs/<id>/` を丸ごとロードできる。

### `_context.yaml` のスキーマ

**決定**: `model.yaml` と重複する情報（description・kind・tags）は持たない。SDD 固有のメタデータのみ。

```yaml
tables:
  fct_orders:
    last_change: 2026-03-10-monthly-sales-summary
    open_questions: 2
    has_spec: true
  dim_customers:
    last_change: 2026-02-20-customer-segmentation
    open_questions: 0
    has_spec: true

decisions:
  - id: D-001
    summary: "amount は税抜で統一"
    date: 2026-03-10
    affects: [fct_orders, mart_revenue]
    change: monthly-sales-summary
```

**理由**: `model.yaml` の description/kind/tags はビジュアライザーと MCP で既に取得可能。重複を持つと同期ズレが生じる。

### パイプラインレベル質問の扱い

**決定**: `changes/<name>/questions.md` の `## Pipeline-level` セクションの質問は `specs/` に昇格させない。`changes/archive/` に残して `modscape spec search` で参照可能にする。

**理由**: パイプラインレベルの質問は特定 change に紐づいた文脈であり、テーブルの恒久知識ではない。重要な決定事項は `_context.yaml` の `decisions` に要約として記録する。

### 既存 `specs/questions.md` のマイグレーション

**決定**: `archive` スキルが初回実行時に `specs/questions.md`（旧形式）が存在すれば、テーブルセクション単位でテーブルディレクトリに移動してから処理を続行する。

**理由**: 後方互換性を保ちつつ段階的に移行できる。

### ビジュアライザー側の読み込み

**決定**: `_context.yaml` は `model.yaml` と同じディレクトリから読み込む。存在しない場合は何も表示しない（optional）。

表示箇所：
- テーブルカード: `open_questions > 0` のとき ❓バッジ、`has_spec: true` のとき 📝バッジ
- 詳細パネル: `last_change`・`open_questions` 件数
- サイドバー新タブ "Decisions": `decisions` リスト

## Risks / Trade-offs

- **既存 `specs/<table-id>.md`（平面ファイル）との共存** — 移行前は `specs/fct_orders.md`（ファイル）と `specs/fct_orders/`（ディレクトリ）が混在しうる。`archive` スキルが旧ファイルを検出して自動的にディレクトリへ移動する。
- **ビジュアライザービルドが必要** — UI 変更後は `npm run build-ui` + スナップショット更新が必要。
- **`_context.yaml` の手動編集リスク** — YAML フォーマットが崩れると UI が壊れる。バリデーションは archive スキル内で行う（最低限 `tables` キーの存在確認）。
