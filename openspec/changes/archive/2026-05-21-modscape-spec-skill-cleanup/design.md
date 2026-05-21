## Context

modscape:spec スキルコマンド群は SDD（Spec-Driven Development）ワークフローを AI エージェントに提供する。現在 15 コマンドが存在しているが、そのうち `amend` / `save` / `load` の 3 コマンドは実際には使用されていない。また `check` コマンドはアーティファクト間の固定ペアワイズ比較のみを行い、「どれが正（SSOT）か」を考慮しないため整合性チェックとして弱い。

削除対象 3 コマンドへの参照が他のスキルファイルにも散在しているため、単純なファイル削除だけでなく参照除去も必要。

## Goals / Non-Goals

**Goals:**
- `amend` / `save` / `load` スキルファイルをすべてのテンプレート（claude / codex / gemini）から削除する
- 他スキルファイルから削除コマンドへの参照を除去する
- `check` スキルを SSOT 指定型の整合性チェッカーとして再設計する（claude / codex / gemini）
- `openspec/specs/sdd-amend/` と `openspec/specs/sdd-save/` の廃止を記録する

**Non-Goals:**
- `tasks.md` と進捗状態の構造分離（別 change で対応）
- `sdd-load` の spec ファイルを削除すること（`sdd-save` の一部として扱われているため）
- check コマンドに自動修正機能を追加すること

## Decisions

### 1. check コマンドの再設計方針: SSOT 指定型

**決定**: `check` コマンドを「SSOT を明示して、他アーティファクトをそこから検証する」方式に変更する。

**構文**:
```
/modscape:spec:check <name> [--from <artifact>]
```

`--from` の選択肢:
| 引数 | SSOT |
|---|---|
| 省略（デフォルト）| `spec-model.yaml` |
| `--from design.md` | `design.md` |
| `--from spec.md` | `spec.md` |

**SSOT 別チェック内容**:

| SSOT | 検証対象 | チェック内容 |
|---|---|---|
| `spec-model.yaml` | design.md | spec-model.yaml の全テーブルが Affected Tables に分類されているか |
| `spec-model.yaml` | tasks.md | Direct Impact テーブルにタスクが存在するか |
| `spec-model.yaml` | questions.md | 未解決 Q に対応する assumption が design.md にあるか |
| `design.md` | spec-model.yaml | Implementation Details のテーブルが spec-model.yaml に存在するか |
| `design.md` | tasks.md | Direct Impact テーブルにタスクが存在するか |
| `design.md` | spec.md | AC が design.md の設計決定と矛盾していないか（文言確認）|
| `spec.md` | design.md | 全 AC が design.md で言及されているか |
| `spec.md` | tasks.md | 全 AC に Phase 4 テストタスクまたは manual verification があるか |

**採用理由**: 現行の固定ペアワイズ比較では「どちらを修正すべきか」が分からない。SSOT を明示することで「SSOT は正しい、他を直せ」という明確な修正方向を提示できる。

**却下した代替案**: 全ペアワイズ比較を維持しつつ「推奨修正先」を表示する案 → 結局どれが真実かが曖昧なままになる。

### 2. 削除コマンドへの参照除去: ファイル単位で除去

**決定**: 参照が存在するファイルごとに、該当セクション（例: `help.md` の Usage 一覧、`implement.md` の Minor fix セクション内の `@modscape-spec-amend` 言及）を削除または書き換える。

参照除去対象ファイル:

| 削除コマンド | 参照ファイル（claude） | 参照ファイル（codex/gemini） |
|---|---|---|
| `save` / `load` | `design.md`, `help.md`, `implement.md`, `requirements.md` | 同名 SKILL.md |
| `amend` | `answer.md`, `help.md`, `status.md` | 同名 SKILL.md |

### 3. openspec/specs の廃止処理

**決定**: `sdd-amend/` と `sdd-save/` の spec.md に廃止コメントを追記し、ファイルは削除しない（履歴として残す）。

**理由**: spec ファイルを削除すると `openspec status` や diff 履歴で変更の経緯が追えなくなる。廃止の明示で十分。

## Risks / Trade-offs

- **リスク**: `check` の再設計で既存の Part 1 / Part 2 の一部チェックが失われる可能性
  → **緩和策**: SSOT = spec-model.yaml（デフォルト）のチェック内容は現行 Part 1 の B・C チェックと実質同等になるよう設計する。Part 2 の Readiness チェック（未解決 Q、AC Coverage、Documentation Coverage）は SSOT によらず常に実行する。

- **リスク**: codex / gemini テンプレートが claude テンプレートと構造的に異なる場合、同一の変更が単純コピーにならない
  → **緩和策**: 実装時に各テンプレートを個別確認してから編集する。

## Migration Plan

1. claude テンプレートを先に変更・確認する（正のテンプレートとして機能させる）
2. codex / gemini テンプレートを claude に合わせて変更する
3. `openspec/specs/sdd-amend/` と `openspec/specs/sdd-save/` に廃止注記を追記する

ロールバック: ファイル削除は git で復元可能。参照除去も差分が明確なため問題なし。

## Open Questions

なし
