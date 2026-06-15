## Context

`_context.yaml`・`_glossary.yaml`・`_questions.yaml` の3ファイルはSDD（Spec-Driven Development）プロセスを通じて蓄積されるデータ基盤の暗黙知ファイルである。AIエージェントがSQL/プログラムを生成する際にこれらを参照することを想定しているが、現状以下の問題がある。

1. **絞り込み取得手段がない**: 3ファイルの全量をAIに渡すしかなく、トークン消費が大きい。`ids` フィールドはスキーマ上は任意フィールドとして存在するが（`context-yaml-schema`・`questions-yaml-schema` の既存Requirement）、実際のエントリに付いていないケースが多く、テーブルID指定での絞り込みが機能しない。
2. **ノイズの混入**: アーカイブスキルが「SDDで決定したこと全般」を書き込むため、ツール選択・組織体制・更新頻度など、データ解釈に無関係な情報が混入する。

## Goals / Non-Goals

**Goals:**
- テーブルIDを指定して3ファイルから関連知識だけを取得できるCLIコマンドを追加する
- アーカイブスキルに「データ分析知識のみを収録する」キュレーション基準を組み込む
- codegen / spec:implement スキルが新CLIコマンドを使って知識を取得するよう更新する

**Non-Goals:**
- YAMLスキーマの後方互換性を壊すこと（`ids` は任意フィールドのまま）
- 3ファイルのデータをDBやインデックスに移行すること
- visualizer側のUI変更

## Decisions

### D-1: `modscape spec context` をサブコマンドとして追加する

`specCommand` の下に `context` サブコマンドを追加する（`modscape spec search` と同パターン）。

```
modscape spec context --ids fct_orders,dim_customers [--json]
```

**実装場所:** `src/specs.js` に `runContextGet()` を追加し、`src/index.js` でコマンド登録。`loadContext`・`loadGlossary`・`loadQuestions` 関数が `src/specs.js` に既存のためそこに実装を集約する。

**出力フォーマット（`--json`）:**

```json
{
  "for_ids": ["fct_orders", "dim_customers"],
  "decisions": [
    { "id": "D-002", "summary": "fct_ordersの粒度はorder_id × product_key", "ids": ["fct_orders"] }
  ],
  "rules": [
    { "id": "Q-001", "rule": "status='cancelled'を除外する", "why": "...", "counter_case": "...", "applies_to": ["fct_orders"] }
  ],
  "terms": [
    { "id": "order-line", "label": "注文明細", "definition": "..." }
  ]
}
```

`change`・`date` などのプロベナンス情報は**出力に含めない**（AI推論に不要なため）。

**フィルタリングロジック:**
- `_context.yaml` decisions: `ids` に指定テーブルIDを1つ以上含むエントリ、または `scope: global` のエントリ
- `_questions.yaml` questions: `ids` に指定テーブルIDを1つ以上含む、かつ `status: answered` または `status: assumed` のエントリのみ（`status: open` は未解決のためAI推論の材料にしない）
- `_glossary.yaml` terms: `ids` に指定テーブルIDを1つ以上含むエントリ、または `ids` が空のエントリ（語彙は全体に適用されることが多いため）

**テキスト出力（`--json` なし）:** 各セクションを見やすく整形して標準出力する

### D-2: アーカイブスキルのキュレーション基準を文章化する

アーカイブスキルの Step 4（questions）・Step 4.5（glossary）・Step 5（context）に判断基準を追記する。

**収録するもの（データ分析知識）:**
- フィルター不変条件（「このカラムには必ずこの条件が要る」）
- NULL / フラグの実際の意味
- JOIN時のファンアウト・粒度の罠
- タイムゾーン・通貨・単位の変換ルール
- ビジネス用語の定義（SQLレベルで表現できるもの）
- 判断が割れる局面での根拠（`why` フィールド）と反例（`counter_case` フィールド）

**除外するもの（ツール/組織/運用情報）:**
- 実装ツールの選択（「dbtを使う」「SQLMeshを使う」）
- 組織の担当・更新頻度・SLA
- インフラ・デプロイ手順
- `ids` が付けられない（どのエンティティにも紐づかない）抽象的な決定

3プラットフォーム（claude/codex/gemini）の archive スキルテンプレートすべてに同内容を反映する。

### D-3: codegen / spec:implement スキルの知識取得ステップを置き換える

**変更前（claude/codegen.md）:**
```
THIRD, load SDD context from `.modscape/specs/` if it exists:
- `_context.yaml`
- `_glossary.yaml`
- `_questions.yaml`
```

**変更後（全プラットフォーム共通）:**
```
THIRD, collect target table IDs from spec-model.yaml, then:
  modscape spec context --ids <id1>,<id2>,... --json
Use returned decisions/rules/terms for code generation.
```

`spec:implement` スキルでは、各タスク処理前に対象テーブルIDを特定してコマンドを実行する（テーブルごとに1回）。

## Risks / Trade-offs

- **`ids` 付与の漏れ**: アーカイブスキルが生成するエントリに `ids` が付いていないと、コマンドで引けないエントリになる。既存エントリの `ids` 補完は手動作業が必要（D-001〜D-004 in `_context.yaml`、Q-003 in `_questions.yaml`）。
  → 対応: タスクに既存エントリの補完作業を含める

- **グローバルルールの見落れ**: `scope: global` が付いていないと全テーブル共通のルールが引けない（例：タイムゾーン変換）。
  → 対応: アーカイブスキルに「複数テーブルに適用されるルールは `scope: global` を付ける」指示を追加する
