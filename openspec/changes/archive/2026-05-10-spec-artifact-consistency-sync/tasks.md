## 1. amend.md の拡張（spec-model.yaml mutation + 波及確認レポート）

- [x] 1.1 `src/templates/claude/spec/amend.md` を読み込み、現状の更新対象推定方針を確認する
- [x] 1.2 モデルの構造変更（列追加・型変更・制約変更）を「軽微」と判断する条件と、テーブル・lineage 変更を「設計変更」と判断する条件を定義してドキュメントに追記する
- [x] 1.3 軽微な修正の場合に `spec-model.yaml` を mutation CLI で即時修正し `modscape validate` を実行するステップを amend.md に追加する
- [x] 1.4 設計変更と判断した場合にユーザー確認を求め `/modscape:spec:design <name>` 再実行を案内するステップを amend.md に追加する
- [x] 1.5 すべての変更適用後に波及確認レポート（spec.md / design.md / spec-model.yaml の3列テーブル）を出力するステップを amend.md に追加する

## 2. design.md（再実行）の拡張（spec.md AC 整合確認）

- [x] 2.1 `src/templates/claude/spec/design.md` を読み込み、再実行時のステップ（step 4）を確認する
- [x] 2.2 `spec-model.yaml` 変更後に `spec.md` の `## Acceptance Criteria` を確認して矛盾する AC を特定するステップを design.md に追加する
- [x] 2.3 矛盾する AC が見つかった場合はその場で `spec.md` を修正するステップを追加する
- [x] 2.4 設計完了時に波及確認レポート（spec.md / design.md / spec-model.yaml の3列テーブル）を出力するステップを design.md に追加する

## 3. implement.md の拡張（インライン発見処理）

- [x] 3.1 `src/templates/claude/spec/implement.md` を読み込み、現状の「Issues During Implementation」セクションを確認する
- [x] 3.2 軽微な修正（列レベル）と設計変更（構造レベル）の判断基準を implement.md に定義する
- [x] 3.3 軽微な修正の場合に `spec-model.yaml` 修正 → `spec.md` AC 確認 → `design.md` Findings 記録 → 波及確認レポート出力 → 実装継続 のインラインフローを implement.md に追加する
- [x] 3.4 設計変更の場合に `design.md` Findings 記録 → 実装中断 → `design` 再実行案内 のフローを implement.md に追加する
- [x] 3.5 波及確認レポートのフォーマット（「インライン修正」ラベル付き3列テーブル）を implement.md に追加する

## 4. Gemini / Codex バージョンの同期

- [x] 4.1 `src/templates/gemini/` 配下の `amend` に対応する SKILL.md を特定して同期する
- [x] 4.2 `src/templates/gemini/` 配下の `design` に対応する SKILL.md を特定して同期する
- [x] 4.3 `src/templates/gemini/` 配下の `implement` に対応する SKILL.md を特定して同期する
- [x] 4.4 `src/templates/codex/` 配下の同3ファイルを同期する
