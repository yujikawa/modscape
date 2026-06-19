## Context

modscapeのSDD開発フローは `modscape-spec-requirements`（新規パイプライン向け構造化インタビュー）と `modscape-spec-requirements-lite`（軽微な変更向け）の2スキルで構成されている。いずれも「何をするか決まっている」前提で始まるため、「課題はあるが何をすべきか曖昧」な状態に対応するエントリーポイントが存在しない。

このdesignでは `modscape-spec-explore` スキル（`SKILL.md`）の構造と振る舞いを定義する。

## Goals / Non-Goals

**Goals:**
- 要件が固まっていない状態から会話で探索し、適切な次のスキルへ案内できるスキルを作る
- `opsx:explore` と同様のスタンス（会話型・制約なし）を持ちながらmodscapeドメインに特化する
- modscape MCPツールを使ってschema/lineage/既存specを参照しながら探索できる

**Non-Goals:**
- `spec.md` / `design.md` / `tasks.md` を直接生成すること（既存スキルの役割）
- 構造化インタビューの代替（それは `modscape-spec-requirements` の役割）
- 実装まで一気通貫で行うこと

## Decisions

### スタンス：自由な会話型（固定の質問リストなし）

`modscape-spec-requirements` が「何を聞くか決まっている」構造化インタビューであるのに対し、このスキルはユーザーの話の流れに沿って自由に探索する。`opsx:explore` と同じスタンス（thinking partner）を採用する。

**採用しなかった選択肢:** ある程度構造化したガイド質問を用意する案 → 探索フェーズの本質は「まだ何を聞けばよいかもわからない」状態であるため、固定の質問リストは適さない。

### Schema参照：modscape MCPツールを使う

探索中にschema・lineage・既存specを参照する際は `mcp__modscape__*` ツールを優先する。`grep` や直接ファイル読み込みは使わない（既存スキルの規約と同一）。

参照対象:
- `modscape table list` / `modscape table get` — テーブル・カラム構造
- `modscape lineage list` — 依存関係
- `modscape summary` — 全体俯瞰
- `openspec/specs/<capability>/spec.md` — 既存スペック

### 着地：案内で終わる（ファイルを生成しない）

探索の結果として方針が固まった時点で、次に実行すべきスキルを案内して終了する。

| 方針の規模 | 案内先 |
|-----------|--------|
| カラム追加・テーブルリネーム等の軽微な変更 | `@modscape-spec-requirements-lite` |
| 新規パイプライン・複数テーブルにまたがる変更 | `@modscape-spec-requirements` |

**採用しなかった選択肢:** 探索結果を `spec.md` に書き出す案 → ファイルを生成すると既存のSDD生成フローと二重になるため、「思考整理ツール」として会話のみで完結させる。

### 終了タイミング：ユーザー主導

探索をいつ終えるかはユーザーが決める。スキルが「方針が固まりましたね」と提案し、ユーザーが同意したら案内を出す。ユーザーが「もう少し続けたい」と言えば探索を継続する。

## Risks / Trade-offs

- [リスク] 探索が発散して方針がまとまらない → スキル側から「今まで見えてきたことをまとめましょう」と能動的に整理を提案する
- [リスク] `modscape-spec-requirements` との境界が曖昧でユーザーが迷う → ドキュメント上とスキル内で使い分けの基準を明示する
- [トレードオフ] ファイルを生成しないため探索の内容が次セッションに引き継がれない → 現時点ではこれを許容する。必要であれば将来的に `exploration-notes.md` のような任意保存の仕組みを追加できる
