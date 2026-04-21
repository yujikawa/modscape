## Context

現在のSDDスタックは `_context.yaml`（decisions/Q&A）と `specs/<table>/`（テーブル単位仕様）で構成されているが、複数テーブルにまたがる用語の定義を置く場所がない。AIとのやり取りや人間がモデルを読む際に「この`customer`とあの`account`は同じか？」「`net_revenue`は税抜きか税込みか？」という曖昧さが繰り返し発生する。

`_glossary.yaml` を新設し、SDDワークフローの中で自然に育てていく設計とする。

## Goals / Non-Goals

**Goals**
- プロジェクト共通の用語を `_glossary.yaml` に集約する
- `spec:requirements` / `spec:answer` で用語が確定したタイミングで逐次更新するフローを作る
- ContextPanel から用語集を参照できるようにする
- `modscape context export` の出力に glossary を含める

**Non-Goals**
- 用語の自動抽出（AIが能動的にモデルを解析してglossaryを生成する機能）
- 用語とカラムの整合性バリデーション

## Decisions

### 1. `_glossary.yaml` は `_context.yaml` と独立したファイルにする
**理由**: `_context.yaml` は「なぜそうなったか」（decisions/Q&A）、`_glossary.yaml` は「何を意味するか」（定義辞書）と性質が異なる。同居させると肥大化し検索性が落ちる。

### 2. スキーマ構造

```yaml
terms:
  - id: net_revenue          # kebab-case の一意識別子
    label: "純売上"           # 日本語ラベル（省略可）
    definition: "discount_amount控除後・税抜きの売上金額"
    tables: [fct_orders, mart_daily_revenue]   # 関連テーブル（省略可）
    columns: [fct_orders.net_revenue]          # 関連カラム（省略可）
    change: revenue-pipeline-v2                # 定義が確定したチェンジ（省略可）
    date: "2026-02-10"                         # 省略可
```

`tables` / `columns` はオプション。用語レベルで十分な場合はリンクなしでも運用できる。

### 3. SDD スキルの更新方針: 既存スキルへの追記のみ
専用の `spec:glossary` スキルは作らない。`spec:requirements` と `spec:answer` に「用語が登場・確定したら `_glossary.yaml` を確認し、新規用語は追加、定義変更があれば更新する」指示を追記するだけで十分。スキル数を増やさない。

### 4. `modscape init --sdd` で空テンプレートを生成
`_context.yaml` と同様に `init --sdd` 時に `_glossary.yaml` の空テンプレートを生成する。`spec new` のタイミングでは生成しない（`_context.yaml` と同じ方針）。

### 5. `/api/glossary` エンドポイント + build インジェクション
`_context.yaml` と同じパターンで実装する。dev サーバーは `/api/glossary` で YAML テキストを返し、build 時は `glossaryData` として `window.__MODSCAPE_DATA__` に注入する。

## Risks / Trade-offs

- **用語が育たないリスク** → SDD スキルへの指示追記でワークフロー上の摩擦を最小化する。強制はしない
- **`tables` / `columns` リンクの陳腐化** → テーブルIDやカラムIDが変わると参照切れになるが、バリデーションはスコープ外。運用でカバー

## Migration Plan

既存プロジェクトへの影響なし。`_glossary.yaml` が存在しない場合は空として扱う（パーサーが `null` を返しても ContextPanel は Glossary セクションを非表示にするだけ）。

## Open Questions

なし
