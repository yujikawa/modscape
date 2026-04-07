## 1. sdd-requirementsスキル更新

- [x] 1.1 `sdd-requirements` スキルのプロンプトをフォルダ構造対応に更新（`sdd/<name>/spec.md` への出力先変更）
- [x] 1.2 要件収集後にフォルダ名をAIが提案しユーザー承認を得るロジックをプロンプトに追加
- [x] 1.3 既存フォルダ名衝突時の警告メッセージをプロンプトに追加
- [x] 1.4 完了後の次スキル誘導メッセージを `/modscape:sdd:design <name>` 形式に更新

## 2. sdd-designスキル更新

- [x] 2.1 `sdd-design` スキルのプロンプトを `sdd/<name>/spec.md`・`model.yaml`・`specs/*.md` を読み込むよう更新
- [x] 2.2 影響テーブルの自動特定ロジック（直接影響・間接影響の判定基準）をプロンプトに追加
- [x] 2.3 設計判断と影響テーブルリストを `sdd/<name>/design.md` に記録するロジックをプロンプトに追加
- [x] 2.4 再実行時に `design.md` の気づきセクションを読み込んで設計を更新するロジックをプロンプトに追加
- [x] 2.5 再実行時に `tasks.md` の完了済みタスクを保持したまま差分更新するロジックをプロンプトに追加
- [x] 2.6 tasks.md 生成ロジックを `sdd/<name>/tasks.md` 出力に更新（sdd-tasks スキルを統合）

## 3. sdd-implementスキル更新

- [x] 3.1 `sdd-implement` スキルのプロンプトを `sdd/<name>/tasks.md` 参照に更新（引数 `<name>` 対応）
- [x] 3.2 全タスク完了時の案内メッセージを `/modscape:sdd:archive <name>` 形式に更新

## 4. sdd-archiveスキル新規作成

- [x] 4.1 `sdd-archive` スキルのプロンプトファイルを新規作成
- [x] 4.2 `sdd/<name>/spec.md`・`design.md`・`model.yaml` lineage から影響テーブルを自動特定するロジックをプロンプトに記述
- [x] 4.3 直接影響テーブルの `specs/<table-id>.md` 生成・更新ロジックをプロンプトに追加
- [x] 4.4 間接影響テーブルの Changelog 追記のみのロジックをプロンプトに追加
- [x] 4.5 同期完了後の削除確認フローをプロンプトに追加

## 5. sdd-table-specフォーマット定義

- [x] 5.1 `specs/<table-id>.md` の標準フォーマットをドキュメント化（`src/templates/rules.md` または `.modscape/sdd/sdd.custom.md.example` に追記）
- [x] 5.2 spec進捗確認JSON（テーブルリストとspecの有無・最終更新日）の出力ロジックを `sdd-archive` または独立スキルとして定義

## 6. modscape init更新

- [x] 6.1 `modscape init --claude --sdd` の生成物に `specs/` ディレクトリのプレースホルダーを追加
- [x] 6.2 `sdd.custom.md.example` のテンプレートに新フォルダ構造の説明を追記

## 7. ドキュメント更新

- [x] 7.1 `README.md` / `README.ja.md` のSDD関連セクションを新フロー・新コマンド形式に更新
- [x] 7.2 `src/templates/rules.md` のSection 13（CLI Flag Reference）にarchiveスキルを追記
- [x] 7.3 `CHANGELOG.md` にSDDワークフロー再設計のエントリを追加
