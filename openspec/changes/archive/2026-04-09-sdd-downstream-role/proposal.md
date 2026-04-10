## Why

`modscape extract --with-downstream` の導入により、設計フェーズで修正対象テーブルの全下流テーブルが spec-model.yaml に取り込まれるようになった。しかし現状の implement / archive スキルはこれらのテーブルを区別せず、「実装が不要な参照用テーブル」まで実装・spec作成しようとする。下流テーブルを「実装対象」と「コンテキスト参照のみ」に分類し、各スキルがその分類に従って動作するよう変更する。

## What Changes

- `design.md` の `## Affected Tables` セクションの `### Downstream Impact` を2つのサブセクションに分割する
  - `### Downstream Impact — Implement`: 下流テーブルのうち、今回の変更で実際に修正が必要なもの
  - `### Downstream Impact — Context Only`: 下流テーブルのうち、参照・確認目的で取り込んだが修正は不要なもの
- design スキルが上記分類を AI 推論で初期提案し、ユーザーが `design.md` を編集して修正できる
- implement スキルが `design.md` を読み、`Context Only` に分類されたテーブルの実装をスキップする
- archive スキルが `design.md` を読み、`Context Only` テーブルには Changelog のみ追記（フル spec 作成・更新は行わない）

## Capabilities

### New Capabilities

なし

### Modified Capabilities

- `sdd-design`: `## Affected Tables` の Downstream Impact セクションの書き方と分類ロジックが変わる
- `sdd-implement`: `design.md` の分類を読んでスキップ判断するロジックが追加される
- `sdd-archive`: `design.md` の分類に応じた spec sync 処理の分岐が変わる

## Impact

- `src/templates/claude/spec/design.md` — Downstream Impact の分割記述と AI 分類ロジック
- `src/templates/claude/spec/implement.md` — Context Only スキップロジック
- `src/templates/claude/spec/archive.md` — Context Only の Changelog のみ処理
- `src/templates/gemini/` および `src/templates/codex/` の対応スキルを同期
