## Context

modscape は現在、以下の2つのAIスキルを Claude Code 向けに提供している。

- `/modscape:modeling` — 対話的に model.yaml を作成・更新する
- `/modscape:codegen` — model.yaml から dbt 等の実装コードを生成する

これらは `modscape init --claude` で生成され、`.modscape/claude/` に配置される。スキルは対応するルールファイル（`.modscape/rules.md`, `.modscape/codegen-rules.md`）を読み込んで動作する。

本変更では同じパターンで SDD（仕様駆動データエンジニアリング）ワークフローを担う4スキルを追加する。

## Goals / Non-Goals

**Goals:**
- ビジネス要件 → model.yaml設計 → タスク分解 → 実装 の4ステップを AIスキルとして実現する
- 各スキルが次のスキルへの導線をメッセージで案内し、ユーザーが迷わない一方向フローを作る
- `.modscape/sdd/sdd.custom.md` でプロジェクト固有ルールを上書きできる拡張ポイントを設ける
- Claude Code にのみ対応する（初期スコープ）
- `modscape init --claude --sdd` でオプトイン生成する

**Non-Goals:**
- Gemini CLI / Codex への対応（将来拡張として構造だけ意識する）
- CLIコマンドの新設（AIスキルのみで完結させる）
- model.yaml スキーマへの `spec:` セクション追加
- 自動テストの整備（手動で .gitignore 環境にて確認する）

## Decisions

### 1. スキルファイルの配置場所

**決定**: `.modscape/claude/sdd/` サブディレクトリに4ファイルを配置する

```
.modscape/
  claude/
    modeling.md        ← 既存
    codegen.md         ← 既存
    sdd/               ← NEW
      requirements.md  ← /modscape:sdd:requirements
      design.md        ← /modscape:sdd:design
      tasks.md         ← /modscape:sdd:tasks
      implement.md     ← /modscape:sdd:implement
  sdd/                 ← NEW（プロジェクト成果物）
    spec.md
    tasks.md
    sdd.custom.md      ← プロジェクト固有ルール（任意）
```

**理由**: 既存の `claude/` ディレクトリと同じ命名規則に従い、将来 `gemini/sdd/` 等への拡張が自然にできる。

**代替案**: `claude/` 直下にフラットに置く → SDD スキルが増えると散らかるため却下。

---

### 2. 各スキルの構造パターン

**決定**: 各スキルは以下の構造を持つ

```
1. ルール読み込み宣言（rules.md / codegen-rules.md / sdd.custom.md）
2. スキルの役割説明
3. ステップごとの指示
4. 出力フォーマット（spec.md / tasks.md の期待構造）
5. 次スキルへの誘導メッセージ
```

**理由**: 既存の `modeling.md` / `codegen.md` と同じパターンを踏襲することで、保守性と一貫性を確保する。

---

### 3. `spec.md` の形式

**決定**: `.modscape/sdd/spec.md` に以下の構造を定義する

```markdown
# Pipeline Spec: [タイトル]

## Goal
（何のために・誰のために）

## Stakeholders
- owner:
- consumers: []

## Data Sources
- （既存テーブルや外部ソース）

## Acceptance Criteria
- [ ]

## Target Tool
dbt  # dbt | SQLMesh | Spark SQL | plain SQL

## Status
requirements  # requirements | design | tasks | implementing | done
```

**理由**: openspec の proposal.md と同じ思想で「要件書としての最小構造」を定義する。`Status` フィールドでフローの現在地を表現できる。

---

### 4. `tasks.md` の自動生成ロジック

**決定**: `/modscape:sdd:tasks` スキルは model.yaml の `lineage` セクションをトポロジカルソートし、依存順に Phase 分けしたタスク一覧を生成する

```markdown
# Pipeline Tasks
> Generated from: model.yaml
> Progress: 0 / N

## Phase 1: Staging
- [ ] `stg_orders` [view]

## Phase 2: Core
- [ ] `fct_orders` [incremental/merge] ← stg_orders

## Phase 3: Mart
- [ ] `mart_revenue` [table] ← fct_orders

## Phase 4: Tests
- [ ] fct_orders.order_id — unique, not_null
```

**理由**: lineage の依存グラフは `from → to` で表現されており、上流から下流への実装順序が自然に決まる。AIがこれを読み解いてフェーズ分けするのが最もシンプル。

---

### 5. `sdd.custom.md` によるカスタマイズ

**決定**: 各スキルファイル先頭に以下を記載し、`rules.custom.md` と同じパターンを踏襲する

```markdown
> If `.modscape/sdd/sdd.custom.md` exists, read it in addition to this file.
> Rules in `sdd.custom.md` take priority when they conflict.
```

**理由**: プロジェクトごとに異なるツール（dbt/SQLMesh）、命名規則、フォーマット要件に対応できる。既存の `rules.custom.md` パターンと統一することで学習コストを下げる。

---

### 6. `modscape init` への `--sdd` フラグ追加

**決定**: `src/init.js` に `--sdd` オプションを追加し、`--claude` との組み合わせで `.modscape/claude/sdd/` 配下のスキルファイルを生成する

```bash
modscape init --claude --sdd   # Claude Code + SDD スキルを生成
modscape init --all --sdd      # 全エージェント + SDD（将来拡張を見越した構造）
```

**理由**: SDD を使いたいユーザーは限られるため、デフォルトでは生成しない。オプトイン設計により既存ユーザーへの影響なし。

## Risks / Trade-offs

- **AIスキルの品質はプロンプトに依存する** → サンプルシナリオ（`samples/sdd-sample/`）を用意し、通しで動作確認を行う。自動テストは設けない。
- **`tasks.md` の生成精度** → lineage が未記載の model.yaml では空のタスクリストになる。スキル内で lineage がない場合の案内メッセージを入れる。
- **`--sdd` フラグは `--claude` と組み合わせてのみ有効**（初期スコープ）→ `--gemini --sdd` を指定した場合は「未対応」旨を表示する。
