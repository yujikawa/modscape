## Context

現状、Q&A 情報が `.modscape/specs/_context.yaml` の `questions` セクション（YAML）と `.modscape/changes/<name>/questions.md`（Markdown）の 2 箇所に分散している。形式が混在しているため、ContextPanel での一元表示が困難で、`context export` の出力も断片的になっている。

本変更では `_questions.yaml` を新設し、すべての Q&A をここに集約する。`_context.yaml` は decisions のみを保持するシンプルな構造に整理し、テーブル固有の Q&A も `table` フィールドで紐づける形で同一ファイルに収める。

## Goals / Non-Goals

**Goals:**
- `.modscape/specs/_questions.yaml` を Q&A の唯一の管理ファイルとして確立する
- `_context.yaml` から `questions` セクションを削除し、decisions 専用にする
- SDD スキル（`spec:requirements`・`spec:answer`）の書き込み先を `_questions.yaml` に変更する
- `spec:archive` 時に `questions.md` の内容を `_questions.yaml` に自動マージする
- ContextPanel Q&A タブと `context export` を `_questions.yaml` ベースに変更する
- `modscape init --sdd` で `_questions.yaml` の空テンプレートを生成する

**Non-Goals:**
- `questions.md` フォーマット自体の廃止（archive 前の作業ファイルとして継続利用）
- Q&A の編集 UI（ContextPanel は読み取り専用のまま）
- 既存アーカイブ済み changes の遡及マイグレーション

## Decisions

### `_questions.yaml` のスキーマ設計

```yaml
questions:
  - id: Q-001
    question: "質問テキスト"
    answer: "回答テキスト"          # optional（未回答は省略）
    assumption: "前提テキスト"      # optional
    status: answered                # answered | open | assumed
    table: fct_orders               # optional（テーブル固有の場合のみ）
    date: 2026-01-20
    change: retail-analytics-initial
```

**`table` フィールドを任意にした理由**: プロジェクト横断の Q&A（タイムゾーン、命名規則など）とテーブル固有の Q&A が混在するため。必須にすると汎用 Q&A が登録しにくくなる。

**`status` フィールドを明示的に持つ理由**: `questions.md` では `- [x]` / `- [ ]` で表現していたが、YAML では文字列で明示する方がフィルタリングしやすい。

### `questions.md` → `_questions.yaml` マージ戦略

`spec:archive` スキル内でマージを実施する。コマンド化はせず、archive フローの一部として実行する。

マージルール:
1. `questions.md` の各エントリを読み取り、`_questions.yaml` に追記
2. ID は `_questions.yaml` の最大 ID + 1 から採番（重複防止）
3. `table` フィールドは `spec-config.yaml` の対象テーブルから推定、または省略
4. マージ後、`questions.md` は削除する

**コマンド化しない理由**: archive は既にステップが多く、専用コマンドを追加すると覚えるべき CLI が増える。archive のワークフロー内で完結させる方が自然。

### SDD スキルの書き込み先変更

`spec:requirements` と `spec:answer` の書き込み先を `questions.md` から `_questions.yaml` に変更する。

- `spec:requirements`: 会話中に出た未確認事項を `_questions.yaml` に直接追記（status: open）
- `spec:answer`: 対象エントリを検索して answer / status を更新

**`questions.md` を廃止しない理由（archive 前）**: SDD の中間成果物として、テキストエディタで手軽に確認・編集できる形式も価値がある。ただし書き込み先を統一することで二重管理は解消する。→ 実際には`_questions.yaml`一本化とする。`questions.md` は不要になる。

## Risks / Trade-offs

- **既存 `_context.yaml` の questions 削除**: サンプルデータとして記述済みの Q&A が消える。→ 移行前に `_questions.yaml` へ手動マイグレーションが必要。本実装タスクに含める。
- **ID 採番の衝突**: 複数 change を同時に進めると Q-NNN が重複する可能性。→ archive 時にマージして採番し直すため、作業中は change 内で閉じた採番で問題ない。
- **`spec:requirements` / `spec:answer` の複雑化**: YAML への書き込みは Markdown より厳密なフォーマットが必要。→ スキルテンプレートに具体的な YAML スニペットを記載してガイドする。

## Migration Plan

1. `_questions.yaml` 空テンプレートを `.modscape/specs/` に配置
2. `_context.yaml` の `questions` セクションを `_questions.yaml` に移行（サンプルデータ）
3. `_context.yaml` から `questions` セクションを削除
4. 各種スキルテンプレート・CLI・フロントエンドを更新
5. ビルド確認（`npm run build-ui`）

ロールバック: `_context.yaml` に questions セクションを戻し、スキルテンプレートを元に戻す。`_questions.yaml` は削除。

## Open Questions

なし
