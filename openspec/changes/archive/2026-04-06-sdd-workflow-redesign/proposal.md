## Why

現行のSDD機能は `.modscape/sdd/spec.md` がシングルトンで、複数作業の並行や完了後の記録保持ができない。またデータ開発特有の「実データで動かしたら設計と違った」というループに対応できず、ビジネス要件仕様書が更新されないまま形骸化する問題がある。

## What Changes

- **SDD作業ディレクトリの構造変更**: `sdd/spec.md`（シングルトン）→ `sdd/<name>/`（作業ごとのフォルダ）に変更
- **一時ファイルと恒久ファイルの分離**: 作業中の一時ファイル（`sdd/<name>/`）と恒久的なテーブルspec（`specs/<table>.md`）を明確に分離
- **design.mdの追加**: 設計判断と実データからの気づきを蓄積するファイルを導入
- **`/modscape:sdd:archive` スキルの新規追加**: 作業完了時に `specs/<table>.md` を自動同期するスキル
- **`/modscape:sdd:design` の再実行対応**: 実装中に気づきが発生した際、design.mdを読んで差分ベースで設計・tasks.mdを更新できるように変更
- **`/modscape:sdd:requirements` のフォルダ名提案機能追加**: 作業フォルダ名をAIが提案しユーザーが承認する形式に変更

## Capabilities

### New Capabilities

- `sdd-archive`: SDD作業完了時に `specs/<table>.md` を自動同期し、一時ファイルの削除可否をユーザーに確認するスキル
- `sdd-table-spec`: テーブル単位の恒久的なビジネス仕様書（`specs/<table>.md`）のフォーマット定義

### Modified Capabilities

- `sdd-requirements`: フォルダ構造対応（`sdd/<name>/spec.md` への変更）とフォルダ名提案機能の追加
- `sdd-design`: `model.yaml` + `specs/*.md` + `design.md` を読み込み影響テーブルを自動特定、再実行時の差分更新対応
- `sdd-tasks`: フォルダ構造対応（`sdd/<name>/tasks.md` への変更）
- `sdd-implement`: 対象フォルダを引数で指定できるよう対応

## Impact

- `.modscape/` 配下のディレクトリ構造が変わるため、既存の `sdd/spec.md` / `sdd/tasks.md` を持つプロジェクトは手動移行が必要
- 各SDDスキルのプロンプト（`src/templates/` または `.modscape/` 配下）を全面更新
- `specs/` ディレクトリが新たに導入されるため、`modscape init --claude --sdd` の生成物にも追加
