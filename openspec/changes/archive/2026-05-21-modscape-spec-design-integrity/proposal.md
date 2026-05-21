## Why

`modscape:spec:implement` の実行中にユーザーから修正指摘を受けたとき、生成済みの SQL/dbt ファイルだけが直接書き換えられ、`design.md` や `spec-model.yaml` が更新されないケースが繰り返し発生している。結果として設計書と実装が乖離し、次の設計変更時に何が正しい状態なのかが分からなくなる。また `spec.md` と `design.md` の役割の境界が曖昧で、実装に必要な詳細（検証SQL・変換式）がどちらに書くべきか定まっていない。

## What Changes

- **implement スキル**: 生成済みファイルへの直接編集を禁止し、修正は必ず `design.md → spec-model.yaml → 再生成` の順で行うよう強制する。修正後はタスクのチェックを外すかどうかユーザーに確認する
- **spec.md フォーマット**: 背景・動機と抽象的な受け入れ条件のみに絞り込む。検証方法・詳細SQL・変換式は `design.md` の責務とする
- **design.md フォーマット**: 実装者がここだけ読めば実装できる詳細設計書として位置づけを明確化し、検証SQL・カラム変換式・テストパターンを書けるセクションを追加する
- **answer スキル**: 質問への回答時に `questions.md` の status を更新する前に `design.md` の該当箇所を更新するステップを追加する
- **tasks スキル**: `tasks.md` が既存かつ完了済みタスクがある場合は上書きせず、差分（追加・削除・維持）を表示してユーザーに確認を求めるマージ挙動に変更する

## Capabilities

### New Capabilities

なし

### Modified Capabilities

- `sdd-implement`: 修正発見時の手順（design.md 優先・直接編集禁止・タスク戻し確認）を追加
- `sdd-requirements`: spec.md フォーマットを背景・動機 + 抽象AC のみにシンプル化
- `sdd-design`: design.md フォーマットに実装詳細セクション（検証SQL・変換式・テストパターン）を追加
- `sdd-answer`: 回答時に design.md 更新を必須ステップとして追加
- `sdd-tasks`: 既存進捗のマージ挙動と差分確認フローを追加

## Impact

- `src/templates/claude/spec/implement.md` — 修正発見プロトコルの全面改訂
- `src/templates/codex/modscape-spec-implement/` — 同上（codex 版）
- `src/templates/gemini/modscape-spec-implement/` — 同上（gemini 版）
- `src/templates/formats/` 以下の `design-format.md`・`spec-format.md`（または相当ファイル） — フォーマット定義の更新
- `src/templates/claude/spec/answer.md` — design.md 更新ステップを追加
- `src/templates/codex/modscape-spec-answer/` / `src/templates/gemini/modscape-spec-answer/` — 同上
- `src/templates/claude/spec/tasks.md` — マージ挙動を追加
- `src/templates/codex/modscape-spec-tasks/` / `src/templates/gemini/modscape-spec-tasks/` — 同上
